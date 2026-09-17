class StorageException(Exception):
    """Base exception for all storage-related errors."""
    pass

class FileTooLargeException(StorageException):
    pass

class InvalidMimeTypeException(StorageException):
    pass

class UploadAuthorizationException(StorageException):
    pass
