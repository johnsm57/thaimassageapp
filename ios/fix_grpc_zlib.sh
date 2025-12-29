#!/bin/bash

# Fix gRPC-Core zlib fdopen macro conflict
# This script patches the zlib header file to fix the compilation error
# The fdopen macro conflicts with system fdopen() function in Xcode 15+

GRPC_ZLIB_HEADER="Pods/gRPC-Core/third_party/zlib/zutil.h"

if [ -f "$GRPC_ZLIB_HEADER" ]; then
    echo "🔧 Fixing gRPC-Core zlib header..."
    
    # Comment out all variations of the problematic fdopen macro definition
    # Handle different indentation levels (4 spaces, 6 spaces, 8 spaces)
    sed -i '' 's/^#        define fdopen(fd,mode) NULL \/\* No fdopen() \*\//\/\/ #        define fdopen(fd,mode) NULL \/\* No fdopen() - commented out to fix Xcode 15+ compatibility \*\//' "$GRPC_ZLIB_HEADER"
    sed -i '' 's/^#  define fdopen(fd,mode) NULL \/\* No fdopen() \*\//\/\/ #  define fdopen(fd,mode) NULL \/\* No fdopen() - commented out to fix Xcode 15+ compatibility \*\//' "$GRPC_ZLIB_HEADER"
    sed -i '' 's/^#    define fdopen(fd,mode) NULL \/\* No fdopen() \*\//\/\/ #    define fdopen(fd,mode) NULL \/\* No fdopen() - commented out to fix Xcode 15+ compatibility \*\//' "$GRPC_ZLIB_HEADER"
    
    echo "✅ gRPC-Core zlib header patched successfully!"
    echo "   All fdopen macros have been commented out to prevent conflicts with system headers."
else
    echo "⚠️  gRPC-Core zlib header not found at: $GRPC_ZLIB_HEADER"
    echo "   Make sure you're running this from the ios directory after 'pod install'"
fi

