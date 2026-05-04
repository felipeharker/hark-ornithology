import sys
from PIL import Image

def convert_to_ico(input_path, output_path):
    img = Image.open(input_path)
    # Ensure it's in RGBA format
    img = img.convert("RGBA")
    img.save(output_path, format='ICO', sizes=[(64, 64)])

if __name__ == '__main__':
    convert_to_ico(sys.argv[1], sys.argv[2])
