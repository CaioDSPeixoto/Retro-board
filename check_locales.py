import os
import json
import re
import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

def load_json(path):
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)

def flatten_json(data, prefix=""):
    keys = set()
    for k, v in data.items():
        full_key = f"{prefix}{k}"
        if isinstance(v, dict):
            keys.update(flatten_json(v, f"{full_key}."))
        elif isinstance(v, list):
            keys.add(full_key)
        else:
            keys.add(full_key)
    return keys

def get_namespace_keys(data, prefix=""):
    """Retorna um dict { namespace_prefix -> set(sub_keys) }"""
    result = {}
    for k, v in data.items():
        full_key = f"{prefix}{k}"
        if isinstance(v, dict):
            result[full_key] = set(v.keys())
            sub = get_namespace_keys(v, f"{full_key}.")
            result.update(sub)
    return result

def scan_files(root_dirs, locale_data):
    used_keys = set()
    raw_namespaces = set()  # namespaces acessados via t.raw()
    messages_namespaces = set()  # namespaces acessados via messages.X as any
    template_literal_namespaces = set()  # namespaces com acesso dinâmico via template literal

    def parse_namespace(arg_src: str) -> str:
        s = (arg_src or "").strip()
        if not s:
            return ""
        m = re.match(r'^[\'"]([^\'"]+)[\'"]$', s)
        if m:
            return m.group(1).strip()
        m = re.search(r'\bnamespace\s*:\s*[\'"]([^\'"]+)[\'"]', s)
        if m:
            return m.group(1).strip()
        return ""

    hook_pattern = re.compile(
        r'const\s+(\w+)\s*=\s*(?:await\s+)?(?:useTranslations|getTranslations)\((.*?)\)',
        re.DOTALL,
    )

    # Padrão para t.raw("key")
    raw_pattern_template = r'\b{var}\.raw\([\'"](\w[\w\.\-]*)[\'"]'

    # Padrão para template literals: t(`categories.${variable}`)
    template_pattern_template = r'\b{var}\([`\'"]([^`\'"]*)\$\{{[^}}]+\}}[`\'"]?\)'

    # Padrão para messages.Namespace as any
    messages_pattern = re.compile(
        r'(?:const\s+\w+\s*=\s*)?(?:\(?\s*messages\.(\w+)\s*(?:as\s+any)?)',
        re.DOTALL,
    )

    for root_dir in root_dirs:
        if not os.path.exists(root_dir):
            continue

        for root, _, files in os.walk(root_dir):
            for file in files:
                if not file.endswith(('.tsx', '.ts', '.js', '.jsx')):
                    continue
                path = os.path.join(root, file)
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()

                # 1. Detecta messages.X as any (ex: messages.Home as any)
                for m in messages_pattern.finditer(content):
                    ns = m.group(1)
                    if ns and ns[0].isupper():
                        messages_namespaces.add(ns)

                # 2. Mapeia hooks e namespaces
                hooks = hook_pattern.findall(content)

                for var_name, raw_args in hooks:
                    namespace = parse_namespace(raw_args)

                    # 2a. Busca t('chave'), t.rich('chave'), t(`chave`), etc.
                    usage_pattern = re.compile(
                        r'\b' + re.escape(var_name) + r'(?:\.\w+)?\([\'"`](\w[\w\.\-]*)[\'"`]',
                        re.DOTALL,
                    )
                    for key in usage_pattern.findall(content):
                        if len(key) <= 1:
                            continue
                        if namespace:
                            used_keys.add(f"{namespace}.{key}")
                        else:
                            used_keys.add(key)

                    # 2b. Busca t.raw("key")
                    raw_re = re.compile(raw_pattern_template.format(var=re.escape(var_name)), re.DOTALL)
                    for raw_key in raw_re.findall(content):
                        if namespace:
                            raw_namespaces.add(f"{namespace}.{raw_key}")
                        else:
                            raw_namespaces.add(raw_key)

                    # 2c. Busca template literals: t(`prefix.${var}`)
                    tpl_re = re.compile(template_pattern_template.format(var=re.escape(var_name)), re.DOTALL)
                    for tpl_match in tpl_re.findall(content):
                        prefix = tpl_match.split("$")[0].rstrip(".")
                        if prefix and namespace:
                            template_literal_namespaces.add(f"{namespace}.{prefix}")
                        elif prefix:
                            template_literal_namespaces.add(prefix)

    return used_keys, raw_namespaces, messages_namespaces, template_literal_namespaces


def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    locales_dir = os.path.join(base_dir, "locales")

    locale_files = ["pt.json", "en.json", "es.json"]
    locale_data = {}
    locale_keys = {}

    for lf in locale_files:
        lf_path = os.path.join(locales_dir, lf)
        if not os.path.exists(lf_path):
            print(f"Aviso: {lf} não encontrado, pulando.")
            continue
        data = load_json(lf_path)
        locale_data[lf] = data
        locale_keys[lf] = flatten_json(data)

    if not locale_data:
        print("Nenhum arquivo de locale encontrado.")
        return

    # Usa pt.json como referência
    ref_file = "pt.json"
    ref_keys = locale_keys.get(ref_file, set())
    ref_data = locale_data.get(ref_file, {})

    scan_dirs = [
        os.path.join(base_dir, "app"),
        os.path.join(base_dir, "components"),
    ]

    used_keys, raw_namespaces, messages_namespaces, template_namespaces = scan_files(scan_dirs, ref_data)

    # Filtro de segurança para chaves muito curtas
    used_keys = {k for k in used_keys if len(k.split('.')[-1]) > 1}

    # Marca todas as sub-chaves de namespaces acessados via t.raw() como usadas
    # e remove a chave do namespace em si (não é uma leaf key)
    for raw_ns in raw_namespaces:
        matched = False
        for key in ref_keys:
            if key == raw_ns or key.startswith(raw_ns + "."):
                used_keys.add(key)
                matched = True
        # Se o raw_ns não é uma leaf key, não deve aparecer como "missing"
        if matched:
            used_keys.discard(raw_ns)
        # Se é uma leaf key (ex: array), mantém
        if raw_ns in ref_keys:
            used_keys.add(raw_ns)

    # Marca todas as sub-chaves de namespaces acessados via messages.X as usadas
    for ns in messages_namespaces:
        for key in ref_keys:
            if key.startswith(ns + "."):
                used_keys.add(key)

    # Marca todas as sub-chaves de namespaces com template literals como usadas
    for tpl_ns in template_namespaces:
        for key in ref_keys:
            if key.startswith(tpl_ns + "."):
                used_keys.add(key)

    missing_in_ref = used_keys - ref_keys
    unused_in_ref = ref_keys - used_keys

    print("=" * 60)
    print(f"ANÁLISE DE LOCALES (referência: {ref_file})")
    print(f"  {len(ref_keys)} chaves no JSON | {len(used_keys)} detectadas no código")
    print("=" * 60)

    if missing_in_ref:
        print(f"\n❌ FALTANDO NO {ref_file.upper()} ({len(missing_in_ref)}):")
        for k in sorted(missing_in_ref):
            print(f"  {k}")

    if unused_in_ref:
        print(f"\n⚠️  NÃO ENCONTRADAS NO CÓDIGO ({len(unused_in_ref)}):")
        for k in sorted(unused_in_ref):
            print(f"  {k}")

    if not missing_in_ref and not unused_in_ref:
        print(f"\n✅ {ref_file} e código estão sincronizados!")

    # Comparação entre arquivos de locale
    print("\n" + "=" * 60)
    print("COMPARAÇÃO ENTRE ARQUIVOS DE LOCALE")
    print("=" * 60)

    has_diff = False
    for lf in locale_files:
        if lf == ref_file or lf not in locale_keys:
            continue
        other_keys = locale_keys[lf]
        missing = ref_keys - other_keys
        extra = other_keys - ref_keys

        if missing or extra:
            has_diff = True
            if missing:
                print(f"\n❌ FALTANDO EM {lf.upper()} (presentes em {ref_file}): {len(missing)}")
                for k in sorted(missing):
                    print(f"  {k}")
            if extra:
                print(f"\n⚠️  EXTRAS EM {lf.upper()} (não existem em {ref_file}): {len(extra)}")
                for k in sorted(extra):
                    print(f"  {k}")

    if not has_diff:
        print(f"\n✅ Todos os arquivos de locale possuem as mesmas chaves!")

if __name__ == "__main__":
    main()
