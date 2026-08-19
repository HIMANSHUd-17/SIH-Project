import sys
import re

file_paths = sys.argv[1:]

def repl(m):
    match = m.group(0)
    if match == 'text-[10px]': return 'text-xs'
    if match == 'text-[11px]': return 'text-sm'
    if match == 'text-xs': return 'text-sm'
    if match == 'text-sm': return 'text-base'
    return match

for fp in file_paths:
    try:
        with open(fp, 'r', encoding='utf-8') as f:
            content = f.read()
            
        new_content = re.sub(r'text-\[(10|11)px\]|text-(xs|sm)\b', repl, content)
        
        if new_content != content:
            with open(fp, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Updated {fp}")
        else:
            print(f"No changes in {fp}")
    except Exception as e:
        print(f"Error processing {fp}: {e}")
