#!/bin/bash

# Generate thumbnails for RoboResources images (2022-05-20)
# https://stackoverflow.com/questions/12913667/bash-script-to-create-customized-thumbnails

THUMBS_FOLDER=/home/the404/Development/roboresource/images/THUMBS/
BASE_FOLDER=/home/the404/Development/roboresource/images/
CURDIR=""
mkdir -p $THUMBS_FOLDER
cd $BASE_FOLDER
while IFS= read -d $'\0' -r file ; do
        echo "File found: $file"
        IMAGE_TYPE=`file --mime-type -b "$file" | awk -F'/' '{print $1}'`
        if [ "$IMAGE_TYPE" = "image" ]; then

            filename=$(basename "$file")
            extension="${filename##*.}"
            filename="${filename%.*}"
            # Test if the thumbnail already exists
            OUTNAME="${THUMBS_FOLDER}/${CURDIR}/${filename}_thumb.${extension}"
            if [ ! -f "$OUTNAME" ]; then
                echo "Generating!"
                IMAGE_SIZE=`file -b $file | sed 's/ //g' | sed 's/,/ /g' | awk  '{print $2}'`
                WIDTH=`identify -format "%w" "$file"`
                HEIGHT=`identify -format "%h" "$file"`

                # If the image width is greater that 200 or the height is greater that 150 a thumb is created
                if [ $WIDTH -ge  201 ] || [ $HEIGHT -ge 151 ]; then
                #This line convert the image in a 200 x 150 thumb
                    magick convert -sample 200x150 "$file" "$OUTNAME"
                fi
            fi
        elif [ "$IMAGE_TYPE" = "video" ]; then

            filename=$(basename "$file")
            filename="${filename%.*}"
            echo "file is $filename"
            ffmpeg -i "$file" -vf "select=eq(n\,0)" -q:v 3 -hide_banner -loglevel error -y "${THUMBS_FOLDER}/${CURDIR}/${filename}_videothumb.webp" > /dev/null &
#             echo "Converting video: $file"


        elif [ "$IMAGE_TYPE" = "inode" ]; then
            CURDIR="$file"
            mkdir -p "THUMBS/$CURDIR/"
            echo "DIRECTORY: THUMBS/$CURDIR"
        fi
done < <(find . \( -not -path "*./THUMBS*" \) -print0)
