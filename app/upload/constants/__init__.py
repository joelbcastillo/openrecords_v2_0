"""
 .. module:: upload.constants

"""

CONTENT_RANGE_HEADER = 'Content-Range'

MAX_CHUNKSIZE = 512000  # 512 kb

ALLOWED_MIMETYPES = [
    'video/x-msvideo',
    'image/x-ms-bmp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.presentationml.slideshow',
    'video/x-flv',
    'image/gif',
    'image/jpeg',
    'image/bmp',
    'video/quicktime',
    'audio/mpeg',
    'video/mp4',
    'video/avi',
    'application/vnd.oasis.opendocument.formula',  # this should allow .odf but doesn't
    'application/vnd.oasis.opendocument.graphics',  # this should allow .odg but doesn't
    'application/vnd.oasis.opendocument.presentation',
    'application/vnd.oasis.opendocument.spreadsheet',
    'application/vnd.oasis.opendocument.text',
    'application/pdf',
    'image/png',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/rtf',
    'image/tiff',
    'image/tif',
    'audio/x-wav',
    'audio/wav',
    'audio/mp3',
    'video/x-ms-asf',
    'video/x-ms-wma',
    'video/x-ms-wmv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/bmp',  # .bmp
    'image/x-windows-bmp',  # .bmp alternative
    'application/vnd.openxmlformats-officedocument.presentationml.slideshow',  # .ppsx
    'audio/wav',  # .wav alternative
    'audio/x-ms-wma'  # .wma
]
