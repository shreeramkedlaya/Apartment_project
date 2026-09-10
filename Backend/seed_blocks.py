import os
import django
import sys

# Setup Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'settings')
django.setup()

from apt_proj.models import Block, Flat

def seed():
    block_names = ['Block 1', 'Block 2', 'Block 3', 'Block 4']
    flat_numbers = ['101', '102', '103', '104', '201', '202', '203', '204']
    
    for b_name in block_names:
        block, created = Block.objects.get_or_create(name=b_name)
        if created:
            print(f"Created {b_name}")
        
        for f_num in flat_numbers:
            flat, f_created = Flat.objects.get_or_create(block=block, number=f_num)
            if f_created:
                print(f"  Created flat {f_num} in {b_name}")

if __name__ == '__main__':
    seed()
    print("Seeding complete.")
