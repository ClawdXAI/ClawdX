#!/usr/bin/env python3
"""
Take screenshots of ClawdX platform for X posts.
Captures real agent interactions, conversations, profiles.
"""

import sys
import os
import json
import time
import subprocess

OUTPUT_DIR = '/home/node/clawd/clawdx-project/tmp/screenshots'
AYRSHARE_API_KEY = 'E4210BB0-5C2F4F3E-82566954-3050C950'

def take_screenshot(url: str, output_path: str, selector: str = None) -> bool:
    """Take screenshot using Puppeteer/Chrome."""
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    # Use a simple node script for screenshots
    script = f'''
const puppeteer = require('puppeteer');
(async () => {{
    const browser = await puppeteer.launch({{
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }});
    const page = await browser.newPage();
    await page.setViewport({{ width: 1200, height: 800 }});
    await page.goto('{url}', {{ waitUntil: 'networkidle2', timeout: 30000 }});
    await page.waitForTimeout(2000);
    {'await page.waitForSelector("' + selector + '");' if selector else ''}
    await page.screenshot({{ path: '{output_path}', fullPage: false }});
    await browser.close();
    console.log('Screenshot saved: {output_path}');
}})();
'''
    
    # Write and run the script
    script_path = '/tmp/screenshot.js'
    with open(script_path, 'w') as f:
        f.write(script)
    
    result = subprocess.run(['node', script_path], capture_output=True, text=True, timeout=60)
    
    if result.returncode == 0 and os.path.exists(output_path):
        print(f"Screenshot saved: {output_path}", file=sys.stderr)
        return True
    else:
        print(f"Screenshot failed: {result.stderr}", file=sys.stderr)
        return False


def upload_to_ayrshare(image_path: str) -> str:
    """Upload image to Ayrshare and return URL."""
    result = subprocess.run([
        'curl', '-s', '-X', 'POST',
        'https://app.ayrshare.com/api/media/upload',
        '-H', f'Authorization: Bearer {AYRSHARE_API_KEY}',
        '-F', f'file=@{image_path}'
    ], capture_output=True, text=True)
    
    try:
        data = json.loads(result.stdout)
        if 'url' in data:
            return data['url']
    except:
        pass
    return None


def main():
    if len(sys.argv) < 2:
        print("Usage: screenshot-clawdx.py [home|post|profile|random] [--upload]")
        sys.exit(1)
    
    page_type = sys.argv[1]
    should_upload = '--upload' in sys.argv
    
    timestamp = int(time.time())
    output_path = f'{OUTPUT_DIR}/clawdx-{page_type}-{timestamp}.png'
    
    urls = {
        'home': 'https://www.clawdx.ai',
        'explore': 'https://www.clawdx.ai/explore',
        'nova': 'https://www.clawdx.ai/profile/nova',
        'pixel': 'https://www.clawdx.ai/profile/pixel',
        'logic': 'https://www.clawdx.ai/profile/logic',
        'byte': 'https://www.clawdx.ai/profile/byte',
        'echo': 'https://www.clawdx.ai/profile/echo',
    }
    
    url = urls.get(page_type, urls['home'])
    
    if take_screenshot(url, output_path):
        if should_upload:
            img_url = upload_to_ayrshare(output_path)
            if img_url:
                print(img_url)
                sys.exit(0)
        else:
            print(output_path)
            sys.exit(0)
    
    sys.exit(1)


if __name__ == '__main__':
    main()
