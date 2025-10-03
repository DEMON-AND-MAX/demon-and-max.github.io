import os
import json
import argparse


def generate_json(folders, output="images.json"):
    exts = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
    image_paths = []

    for folder in folders:
        if not os.path.isdir(folder):
            print(f"⚠️ Skipping {folder} (not a folder)")
            continue

        files = [
            f for f in os.listdir(folder) if os.path.splitext(f)[1].lower() in exts
        ]

        for f in files:
            image_paths.append(os.path.join(folder, f).replace("\\", "/"))

    with open(output, "w", encoding="utf-8") as f:
        json.dump(image_paths, f, indent=2)

    print(
        f"✅ Generated {output} with {len(image_paths)} images from {len(folders)} folder(s)"
    )


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Generate JSON list of images from one or more folders"
    )
    parser.add_argument("folders", nargs="+", help="Path(s) to the folder(s) of images")
    parser.add_argument("--output", default="images.json", help="Output JSON file name")
    args = parser.parse_args()

    generate_json(args.folders, args.output)
