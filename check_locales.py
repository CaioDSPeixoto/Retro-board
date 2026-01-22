import os
import json
import re

def load_json(path):
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)

def flatten_json(data, prefix=""):
    keys = set()
    for k, v in data.items():
        if isinstance(v, dict):
            keys.update(flatten_json(v, f"{prefix}{k}."))
        else:
            keys.add(f"{prefix}{k}")
    return keys

def scan_files(root_dirs):
    used_keys = set()
    
    # Regex para capturar tanto useTranslations quanto getTranslations
    # Captura o nome da variável (t) e o namespace ('Finance')
    hook_pattern = re.compile(r'const\s+(\w+)\s*=\s*(?:await\s+)?(?:useTranslations|getTranslations)\([\'"]?(.*?)[\'"]?\)')
    
    for root_dir in root_dirs:
        if not os.path.exists(root_dir): continue
        
        for root, _, files in os.walk(root_dir):
            for file in files:
                if file.endswith(('.tsx', '.ts', '.js', '.jsx')):
                    path = os.path.join(root, file)
                    with open(path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        
                        # 1. Mapeia os hooks e namespaces no arquivo
                        hooks = hook_pattern.findall(content)
                        
                        for var_name, namespace in hooks:
                            # 2. Busca o uso da variável: t('chave'), t.rich('chave'), etc.
                            # O [\'"]([\w\.\-]+)[\'"] garante que pegamos apenas o ID da tradução
                            usage_pattern = re.compile(r'\b' + re.escape(var_name) + r'(?:\.\w+)?\([\'"]([\w\.\-]+)[\'"]', re.DOTALL)
                            usages = usage_pattern.findall(content)
                            
                            for key in usages:
                                if len(key) <= 1: continue 
                                
                                if namespace:
                                    used_keys.add(f"{namespace}.{key}")
                                else:
                                    used_keys.add(key)
                                    
    return used_keys

def main():
    base_dir = r"c:\repos\Retro-board" 
    locales_dir = os.path.join(base_dir, "locales")
    pt_path = os.path.join(locales_dir, "pt.json")
    
    if not os.path.exists(pt_path):
        print(f"Erro: {pt_path} não encontrado.")
        return

    pt_data = load_json(pt_path)
    defined_keys_pt = flatten_json(pt_data)
    
    scan_dirs = [
        os.path.join(base_dir, "app"),
        os.path.join(base_dir, "components"),
    ]
    
    used_keys = scan_files(scan_dirs)
    
    # Filtro de segurança para chaves muito curtas
    used_keys = {k for k in used_keys if len(k.split('.')[-1]) > 1}
    
    missing_in_pt = used_keys - defined_keys_pt
    unused_in_pt = defined_keys_pt - used_keys
    
    print("-" * 60)
    print(f"ANÁLISE DE LOCALES: {len(defined_keys_pt)} chaves no JSON | {len(used_keys)} no código")
    print("-" * 60)

    if missing_in_pt:
        print(f"\n❌ FALTANDO NO PT.JSON ({len(missing_in_pt)}):")
        for k in sorted(missing_in_pt): print(f"  {k}")

    if unused_in_pt:
        print(f"\n⚠️  NÃO ENCONTRADAS NO CÓDIGO ({len(unused_in_pt)}):")
        for k in sorted(unused_in_pt): print(f"  {k}")
    
    if not missing_in_pt and not unused_in_pt:
        print("\n✅ Tudo limpo! O JSON e o código estão em sincronia.")

if __name__ == "__main__":
    main()