from PIL import Image

def remove_black_background(input_path, output_path):
    img = Image.open(input_path).convert("RGBA")
    datas = img.getdata()

    newData = []
    for item in datas:
        r, g, b, a = item
        # If the pixel is close to black, make it transparent
        if r < 35 and g < 35 and b < 35:
            newData.append((0, 0, 0, 0))
        else:
            newData.append(item)

    img.putdata(newData)
    img.save(output_path, "PNG")
    print(f"Successfully processed dark logo with transparent BG: {output_path}")

def remove_white_background(input_path, output_path):
    img = Image.open(input_path).convert("RGBA")
    datas = img.getdata()

    newData = []
    for item in datas:
        r, g, b, a = item
        # If the pixel is close to white, make it transparent
        if r > 225 and g > 225 and b > 225:
            newData.append((0, 0, 0, 0))
        else:
            newData.append(item)

    img.putdata(newData)
    img.save(output_path, "PNG")
    print(f"Successfully processed light logo with transparent BG: {output_path}")

# Paths
dark_src = r"C:\Users\sohaib hafeez\.gemini\antigravity\brain\8d8ec3dd-06a7-4e19-9492-c43a2cda4dd7\.user_uploaded\media_1787819898862.png"
light_src = r"C:\Users\sohaib hafeez\.gemini\antigravity\brain\8d8ec3dd-06a7-4e19-9492-c43a2cda4dd7\.user_uploaded\media_1787819907248.png"

public_dir = r"c:\Users\sohaib hafeez\Desktop\phantomsxmadx admin\phantomsxmadx-admin\public"

remove_black_background(dark_src, f"{public_dir}\\logo-dark.png")
remove_white_background(light_src, f"{public_dir}\\logo-light.png")

# Also update logo.png and logo2.png
remove_black_background(dark_src, f"{public_dir}\\logo.png")
remove_white_background(light_src, f"{public_dir}\\logo2.png")

print("ALL LOGOS PROCESSED WITH TRANSPARENT BACKGROUNDS!")
