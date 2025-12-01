"""
Script to restore all backup files
Khôi phục lại các file backup trước khi chạy lại
"""

import os
import shutil

def restore_backups():
    """Restore all .backup files to original"""
    base_dir = os.path.join(os.path.dirname(__file__), "..", "artifacts", "production")
    
    backup_files = [f for f in os.listdir(base_dir) if f.endswith('.backup')]
    
    if not backup_files:
        print("❌ No backup files found!")
        return
    
    print(f"Found {len(backup_files)} backup files\n")
    
    for backup_file in backup_files:
        original_file = backup_file.replace('.backup', '')
        backup_path = os.path.join(base_dir, backup_file)
        original_path = os.path.join(base_dir, original_file)
        
        try:
            shutil.copy2(backup_path, original_path)
            print(f"✅ Restored: {original_file}")
        except Exception as e:
            print(f"❌ Failed to restore {original_file}: {e}")
    
    print(f"\n✅ All backups restored!")
    print(f"💡 You can now run auto_label_difficulty.py again")

if __name__ == "__main__":
    restore_backups()

