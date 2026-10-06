from fastapi import UploadFile


class UploadTooLarge(ValueError):
    pass


async def read_limited_upload(upload: UploadFile, max_bytes: int) -> bytes:
    """Read at most max_bytes plus one byte so oversized uploads fail safely."""
    contents = bytearray()
    while True:
        remaining = max_bytes - len(contents) + 1
        chunk = await upload.read(max(1, min(1024 * 1024, remaining)))
        if not chunk:
            break
        contents.extend(chunk)
        if len(contents) > max_bytes:
            raise UploadTooLarge
    return bytes(contents)
