#!/usr/bin/env python3
"""
Generate an image for X/Twitter posts with ClawdX branding.
Usage: python3 gen-x-image.py "tweet text" [--upload]

With --upload flag, uploads to Ayrshare and returns the URL.
"""

import sys
import os
import json
import subprocess
import time
from urllib import request

OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY')
AYRSHARE_API_KEY = os.environ.get('AYRSHARE_API_KEY', 'E4210BB0-5C2F4F3E-82566954-3050C950')
ASSETS_DIR = '/home/node/clawd/clawdx-project/assets'
LOGO_PATH = f'{ASSETS_DIR}/logo-official.jpg'
OUTPUT_DIR = '/home/node/clawd/clawdx-project/tmp/x-images'

def generate_image(prompt: str, output_path: str) -> bool:
    """Generate image using OpenAI API."""
    if not OPENAI_API_KEY:
        print("Error: OPENAI_API_KEY not set", file=sys.stderr)
        return False
    
    # Create output directory
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    # Build prompt matching ClawdX banner style
    full_prompt = f"""Create an illustration about: {prompt}

CRITICAL STYLE (match exactly):
- Cute cartoon LOBSTER characters (red/coral orange body, big shiny black eyes, happy expressions)
- Give lobsters fun personalities: one with headphones, one with glasses, one with beanie hat, one with a bow
- Social media elements: chat bubbles, heart icons, notification badges, like buttons
- Vibrant colors: primarily RED and ORANGE lobsters, with BLUE/TEAL accents
- Fun playful cartoon style with thick black outlines
- Dark gradient background (dark blue/black) with subtle tech elements
- Characters should look friendly, excited, social
- NO text in the image
- Square format optimized for Twitter"""

    # Call OpenAI API
    data = json.dumps({
        "model": "dall-e-3",
        "prompt": full_prompt,
        "n": 1,
        "size": "1024x1024",
        "quality": "standard"
    }).encode('utf-8')
    
    req = request.Request(
        'https://api.openai.com/v1/images/generations',
        data=data,
        headers={
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {OPENAI_API_KEY}'
        }
    )
    
    try:
        with request.urlopen(req, timeout=90) as response:
            result = json.loads(response.read().decode('utf-8'))
            image_url = result['data'][0]['url']
            
            # Download image
            img_req = request.Request(image_url)
            with request.urlopen(img_req, timeout=30) as img_response:
                img_data = img_response.read()
                
                # Save base image
                base_path = output_path.replace('.jpg', '_base.png')
                with open(base_path, 'wb') as f:
                    f.write(img_data)
                
                # Add logo watermark using ImageMagick
                subprocess.run([
                    'convert', base_path,
                    '(', LOGO_PATH, '-resize', '120x120', ')',
                    '-gravity', 'SouthEast',
                    '-geometry', '+20+20',
                    '-composite',
                    output_path
                ], check=True)
                
                # Clean up base
                os.remove(base_path)
                
                print(f"Generated: {output_path}", file=sys.stderr)
                return True
                
    except Exception as e:
        print(f"Error generating image: {e}", file=sys.stderr)
        return False


def upload_to_ayrshare(image_path: str) -> str:
    """Upload image to Ayrshare and return URL."""
    import subprocess
    
    result = subprocess.run([
        'curl', '-s', '-X', 'POST',
        'https://app.ayrshare.com/api/media/upload',
        '-H', f'Authorization: Bearer {AYRSHARE_API_KEY}',
        '-F', f'file=@{image_path}'
    ], capture_output=True, text=True)
    
    try:
        data = json.loads(result.stdout)
        if 'url' in data:
            print(f"Uploaded: {data['url']}", file=sys.stderr)
            return data['url']
        else:
            print(f"Upload error: {data}", file=sys.stderr)
            return None
    except Exception as e:
        print(f"Upload error: {e}", file=sys.stderr)
        return None


def main():
    if len(sys.argv) < 2:
        print("Usage: python3 gen-x-image.py 'tweet text' [--upload]")
        sys.exit(1)
    
    tweet_text = sys.argv[1]
    should_upload = '--upload' in sys.argv
    
    # Generate filename from timestamp
    timestamp = int(time.time())
    output_path = f'{OUTPUT_DIR}/x-post-{timestamp}.jpg'
    
    if not generate_image(tweet_text, output_path):
        sys.exit(1)
    
    if should_upload:
        url = upload_to_ayrshare(output_path)
        if url:
            print(url)  # Print URL for caller
            sys.exit(0)
        else:
            sys.exit(1)
    else:
        print(output_path)  # Print local path
        sys.exit(0)


if __name__ == '__main__':
    main()
