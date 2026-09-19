import sys
import requests

def test_cdn_headers(url):
    print("=" * 60)
    print("Testing Supabase CDN Delivery & Range Support")
    print("=" * 60)

    # 1. Full GET Request - Inspect headers
    res = requests.get(url, stream=True)
    print(f"\n[1] Status Code: {res.status_code}")
    print("Response Headers:")
    for k in ['content-type', 'content-length', 'accept-ranges', 'cache-control', 'cf-cache-status', 'etag']:
        if k in res.headers:
            print(f"  - {k}: {res.headers[k]}")

    if 'bytes' in res.headers.get('accept-ranges', '').lower():
        print("  --> [PASS] Server explicitly supports byte-range requests!")
    else:
        print("  --> [WARN] 'accept-ranges' header not explicitly declared.")

    # 2. Test HTTP Range Request (First 1024 bytes)
    headers = {"Range": "bytes=0-1023"}
    range_res = requests.get(url, headers=headers)
    print(f"\n[2] Range Request (bytes=0-1023) Status: {range_res.status_code}")
    if range_res.status_code == 206:
        print("  --> [PASS] HTTP 206 Partial Content received successfully!")
        print(f"  --> Received Bytes: {len(range_res.content)}")
    else:
        print(f"  --> [FAIL] Expected 206, received {range_res.status_code}")

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Please provide a signed URL: python scratch/verify_cdn.py <url>")
        sys.exit(1)
    test_cdn_headers(sys.argv[1])
