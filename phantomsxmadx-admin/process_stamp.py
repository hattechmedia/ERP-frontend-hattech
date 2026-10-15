from PIL import Image

stamp_src = r"C:\Users\sohaib hafeez\.gemini\antigravity\brain\8d8ec3dd-06a7-4e19-9492-c43a2cda4dd7\.user_uploaded\media_1787819632578.png"
output_path = r"c:\Users\sohaib hafeez\Desktop\phantomsxmadx admin\phantomsxmadx-admin\public\official-stamp.png"

img = Image.open(stamp_src).convert("RGBA")
datas = img.getdata()

new_data = []
for item in datas:
    r, g, b, a = item
    # Background in the image is white / gray checkerboard (r > 170 and g > 170 and b > 170)
    # The stamp is blue / dark blue ink (blue component > red component, or dark ink)
    is_white_gray_bg = (r > 160 and g > 160 and b > 160)
    
    if is_white_gray_bg:
        new_data.append((0, 0, 0, 0))
    else:
        # Keep original stamp pixel
        new_data.append(item)

img.putdata(new_data)
img.save(output_path, "PNG")
print("Official stamp background removed cleanly!")
