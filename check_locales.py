
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
    
    for root_dir in root_dirs:
        for root, _, files in os.walk(root_dir):
            for file in files:
                if file.endswith(('.tsx', '.ts')):
                    path = os.path.join(root, file)
                    with open(path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        
                    # Find namespaces pattern: const t = useTranslations("Namespace");
                    # Handle multiple hook usages if any, but usually it's one per component
                    # A more complex parser would be needed for perfect accuracy, but regex is a good start.
                    
                    # Strategy: find all `useTranslations` and their variable names.
                    # e.g. const t = useTranslations('Common');
                    # e.g. const tCommon = useTranslations('Common');
                    
                    # Regex to find variable name and namespace
                    # const\s+(\w+)\s*=\s*useTranslations\(['"](.+?)['"]\)
                    
                    hooks = re.findall(r'const\s+(\w+)\s*=\s*useTranslations\([\'"](.+?)[\'"]\)', content)
                    
                    for var_name, namespace in hooks:
                        # Now find usages of this var_name: t('key')
                        # Pattern: var_name\(['"](.+?)['"]\)
                        
                        pattern = re.escape(var_name) + r'\([\'"](.+?)[\'"]\)'
                        usages = re.findall(pattern, content)
                        
                        for key in usages:
                            full_key = f"{namespace}.{key}"
                            used_keys.add(full_key)
                            
    return used_keys

def main():
    base_dir = r"c:\repos\Retro-board"
    locales_dir = os.path.join(base_dir, "locales")
    pt_path = os.path.join(locales_dir, "pt.json")
    
    if not os.path.exists(pt_path):
        print("pt.json not found")
        return

    pt_data = load_json(pt_path)
    defined_keys_pt = flatten_json(pt_data)
    
    # We should also check en and es to see if they are consistent, but the request focuses on pt.json vs code.
    
    scan_dirs = [
        os.path.join(base_dir, "app"),
        os.path.join(base_dir, "components")
    ]
    
    used_keys = scan_files(scan_dirs)
    
    missing_in_pt = used_keys - defined_keys_pt
    unused_in_pt = defined_keys_pt - used_keys
    
    print("MISSING IN PT.JSON:")
    for k in sorted(missing_in_pt):
        print(k)
        
    print("\nUNUSED IN PT.JSON (Potentially):")
    for k in sorted(unused_in_pt):
        print(k)

if __name__ == "__main__":
    main()
