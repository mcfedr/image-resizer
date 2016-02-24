/**
 * This file is part of image-resizer.
 *  Copyright Fred Cox 2012
 *
 *  Image-resizer is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *  
 *  Image-resizer is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.

 *  You should have received a copy of the GNU General Public License
 *  along with Image-resizer.  If not, see <http://www.gnu.org/licenses/>.
 */
$(function() {
    var dropzone = $('#dropzone'),
    dropzoneParent = dropzone.parent(),
    dropzoneImage,
    dropzoneImageType = 'image/png',
    dropzoneContent = $('#dropzone-placeholder'),
	progress = $('#progress'),
    dropzoneImageContainer = $('#dropzone-image-container'),
    dropzonePos = dropzoneImageContainer.offset(),
    createBtn = $('#create'),
    resetBtn = $('#reset'),
    downloadBtn = $('#download'),
    widthControl = $('#width'),
    heightControl = $('#height'),
    lockControl = $('#lock'),
    fileControl = $('#file-chooser'),
    selectionOuter = $('#selection'),
    selection = $('#selection-inner'),
    selectionCoverNorth = $('.selection-cover.north'),
    selectionCoverSouth = $('.selection-cover.south'),
    selectionCoverEast = $('.selection-cover.east'),
    selectionCoverWest = $('.selection-cover.west'),
    selectionPos = {
        top:0, 
        left: 0, 
        width: 0, 
        height:0
    },
    selectionSizeActive = false,
    selectionSizePos = {
        top: 0, 
        left: 0
    },
    selectionMoveActive = false,
    selectionMovePos = {
        top:0, 
        left: 0, 
        x: 0, 
        y:0
    },
    heightWidthRatio = 1,
    outputWidth = 100,
    outputHeight = 100,
    outputImage,
    locked = false,
    hasTouch = 'ontouchstart' in window;
	
    //Add remove highlight on the dropzone
    dropzone.on('dragenter dragleave', function(e) {
        e.stopPropagation();
        e.preventDefault();
        if(e.type == 'dragenter') {
            dropzoneParent.addClass('drop-hover');
        }
        else {
            dropzoneParent.removeClass('drop-hover');
        }
    });
	
    //Handle the drop
    dropzone.on('drop', function(e) {
        e.stopPropagation();
        e.preventDefault();
        dropzoneParent.removeClass('drop-hover');

        //check for files, that are images
        var files = e.originalEvent.dataTransfer && e.originalEvent.dataTransfer.files;
        handleFiles(files);
    });
    
    fileControl.on('change', function(e) {
        handleFiles(fileControl[0].files);
    });
    
    $(window).on('resize', function() {
        if(dropzoneImage) {
            dropzonePos.width = dropzoneImageContainer.width();
            dropzonePos.height = dropzoneImageContainer.height();
            dropzone.css('height', dropzonePos.height + 30);
        }
    });
    
    function handleFiles(files) {
        if (files && files.length > 0) {
            if(files[0].type.indexOf('image/') != -1) {
                var reader = new FileReader();
				reader.onprogress = function(e) {
					if(e.lengthComputable) {
						progress.css('width', ((e.loaded / e.total) * 100) + '%');
					}
					else {
						progress.css('width', '100%');
					}
				};
                reader.onload = function(e) {
                    if(!dropzoneImage) {
                        dropzoneImage = $(document.createElement('img'));
                        dropzoneImageContainer.append(dropzoneImage);
                        dropzoneImage.on('load', function() {
                            dropzonePos.width = dropzoneImageContainer.width();
                            dropzonePos.height = dropzoneImageContainer.height();
                            dropzone.css('height', dropzonePos.height + 30);
                            
                            locked = false;
                            lockControl.removeClass('active');
                            
                            dropzoneContent.addClass('faded');
                            dropzoneImageContainer.removeClass('faded');
                        });
                    }
                    dropzoneImage.attr('src', '');
                    dropzoneImage.attr('src', e.target.result);
                    dropzoneImageType = files[0].type;
                    resetBtn.removeAttr("disabled");
                };
				reader.onerror = function(e) {
					$('.span7').prepend($('<div class="alert"><a class="close" data-dismiss="alert" href="#">&times;</a><strong>Error!</strong> There was an error loading your image.</div>').alert());
					console.log(this, e);
				};
                reader.readAsDataURL(files[0]);
            }
        }
    }
    
    //create/replace selection area
    dropzone.on(hasTouch ? 'touchstart' : 'mousedown', function(e) {
        if(!locked) {
            if(dropzoneImage) {
                e.stopPropagation();
                e.preventDefault();
                selectionSizePos.top = e.pageY - dropzonePos.top;
                selectionSizePos.left = e.pageX - dropzonePos.left;
                setSelectionSize({
                    top: selectionSizePos.top,
                    left: selectionSizePos.left,
                    width: 0,
                    height: 0
                });
                selectionSizeActive = true;
                $(document.body).css('cursor', 'nwse-resize');
            }
        }
    });
    

    selection.on(hasTouch ? 'touchstart' : 'mousedown', function(e) {
        if(!locked) {
            e.stopPropagation();
            e.preventDefault();
            //in last 5px square start resize
            var offset = selection.offset();
            if(offset.top + selectionPos.height - e.pageY  < 5 && offset.left + selectionPos.width - e.pageX < 5) {
                selectionSizePos.top = selectionPos.top;
                selectionSizePos.left = selectionPos.left;
                selectionSizeActive = true;
                $(document.body).css('cursor', 'nwse-resize');
            }
            else {//overwise start movement
                selectionMovePos.y = e.pageY - dropzonePos.top;
                selectionMovePos.x = e.pageX - dropzonePos.left;
                selectionMovePos.top = selectionPos.top;
                selectionMovePos.left = selectionPos.left;
                selectionMoveActive = true;
                $(document.body).css('cursor', 'move');
            }
        }
    });
    
    //handle mouse movement
    $(document).on(hasTouch ? 'touchmove' : 'mousemove', function(e) {
        //when resizeing a selection
        if(selectionSizeActive) {
            e.stopPropagation();
            e.preventDefault();
            var currentY = Math.max(0, Math.min(e.pageY - dropzonePos.top, dropzonePos.height)),
            currentX = Math.max(0, Math.min(e.pageX - dropzonePos.left, dropzonePos.width)),
            top = currentY > selectionSizePos.top ? selectionSizePos.top : currentY,
            left = currentX > selectionSizePos.left ? selectionSizePos.left : currentX,
            width = currentX > selectionSizePos.left ? currentX - selectionSizePos.left : selectionSizePos.left - currentX,
            height = heightWidthRatio * width;
                
            if(height + top > dropzonePos.height) {
                height = dropzonePos.height - top;
                width = (1 / heightWidthRatio) * height;
            }
            
            setSelectionSize({
                top: top,
                left: left,
                height: height,
                width: width
            });
            
            selectionOuter.removeClass('faded');
            createBtn.removeAttr("disabled");
        } //or moving it
        else if(selectionMoveActive) {
            e.stopPropagation();
            e.preventDefault();
            var offset = dropzone.offset();
            var mouseY = e.pageY - offset.top;
            var mouseX = e.pageX - offset.left;
            var newTop = selectionMovePos.top - (selectionMovePos.y - mouseY);
            var newLeft = selectionMovePos.left - (selectionMovePos.x - mouseX);
            if(newTop < 0) {
                newTop = 0;
            }
            else if(newTop + selection.height() > dropzonePos.height) {
                newTop = dropzonePos.height - selection.height();
            }
            if(newLeft < 0) {
                newLeft = 0;
            }
            else if(newLeft + selection.width() > dropzonePos.width) {
                newLeft = dropzonePos.width - selection.width();
            }
            setSelectionSize({
                top: newTop,
                left: newLeft
            });
        }
    });
	
    //always stop action on mouseup
    $(document).on(hasTouch ? 'touchend' : 'mouseup', function(e) {
        selectionSizeActive = false;
        selectionMoveActive = false;
        if(!locked && (selectionPos.width == 0 || selectionPos.height == 0)) {
            createBtn.attr('disabled', 'disabled');
            selectionOuter.addClass('faded');
        }
        $(document.body).css('cursor', 'auto');
    });
			
    function setSelectionSize(newSelectionPos) {
        if(newSelectionPos.top != undefined) {
            selection.css('top', newSelectionPos.top);  
            selectionPos.top = newSelectionPos.top;
        } 
        if(newSelectionPos.left != undefined) {
            selection.css('left', newSelectionPos.left);
            selectionPos.left = newSelectionPos.left;
        }
        if(newSelectionPos.width != undefined) {
            selection.css('width', newSelectionPos.width);
            selectionPos.width = newSelectionPos.width;
        }
        if(newSelectionPos.height != undefined) {
            selection.css('height', newSelectionPos.height);
            selectionPos.height = newSelectionPos.height;
        }
        
        selectionCoverNorth.css({
            height: selectionPos.top,
            left: selectionPos.left,
            width: selectionPos.width
        });
        selectionCoverSouth.css({
            top: selectionPos.top + selectionPos.height,
            left: selectionPos.left,
            width: selectionPos.width
        });
        selectionCoverEast.css('width', selectionPos.left);
        selectionCoverWest.css('left', selectionPos.left + selectionPos.width);
        
    }
			
    createBtn.on('click', function(e) {
        //only if the selection has some size
        if(locked || (selectionPos.width > 0 && selectionPos.height > 0)) {
            if(!locked) {
                var ratio = dropzoneImage[0].naturalWidth / dropzoneImage.width();
                
                //scale selection size to actual image size
                var scaledSize = {
                    top: Math.floor(selectionPos.top * ratio),
                    left: Math.floor(selectionPos.left * ratio),
                    width: Math.floor(selectionPos.width * ratio),
                    height: Math.floor(selectionPos.height * ratio)
                };

                //get crop region
                var canvas = document.createElement("canvas");
                canvas.width = scaledSize.width;
                canvas.height = scaledSize.height;
                var ctx = canvas.getContext('2d');
                ctx.drawImage(dropzoneImage[0],
                    scaledSize.left, scaledSize.top, scaledSize.width, scaledSize.height,
                    0, 0, scaledSize.width, scaledSize.height);
            }
					
            //scale to output size
            var canvasScaled = document.createElement("canvas");
            canvasScaled.width = outputWidth;
            canvasScaled.height = outputHeight;
            ctx = canvasScaled.getContext('2d');
            ctx.drawImage(locked ? dropzoneImage[0] : canvas, 0, 0, canvasScaled.width, canvasScaled.height);
					
            var d = canvasScaled.toDataURL(dropzoneImageType);
            
            //create output image holder
            if(!outputImage) {
                outputImage = $(document.createElement('img'));
                $('#output-image-container').append(outputImage);
            }
                        
            outputImage.attr('src', d);
            downloadBtn.attr('href', d);
            downloadBtn.attr('download', 'image.' + dropzoneImageType.substr(dropzoneImageType.indexOf('/') + 1));
            downloadBtn.removeClass('disabled');
        }
    });
				
    widthControl.on('change', function() {
        outputWidth = widthControl.val() || 100;
        if(locked) {
            outputHeight = Math.floor(heightWidthRatio * outputWidth);
            heightControl.val(outputHeight);
        }
        else {
            heightWidthRatio = outputHeight / outputWidth;
            setSelectionSize({
                width: (outputWidth / outputHeight) * selectionPos.height
            });

            var height = selectionPos.height,
            width = (outputWidth / outputHeight) * selectionPos.height
            if(width + selectionPos.left > dropzonePos.width) {
                width = dropzonePos.width - selectionPos.left;
                height = heightWidthRatio * width;
            }

            setSelectionSize({
                height: height,
                width: width
            });
        }
    });
				
    heightControl.on('change', function() {
        outputHeight = heightControl.val() || 100;
        if(locked) {
            outputWidth = Math.floor((1 / heightWidthRatio) * outputHeight);
            widthControl.val(outputWidth);
        }
        else {
            heightWidthRatio = outputHeight / outputWidth;

            var width = selectionPos.width,
            height = heightWidthRatio * selectionPos.width;
            if(height + selectionPos.top > dropzonePos.height) {
                height = dropzonePos.height - selectionPos.top;
                width = (1 / heightWidthRatio) * height;
            }

            setSelectionSize({
                height: height,
                width: width
            });
        }
    });
    
    if($.support.transition) {
        dropzoneImageContainer.on($.support.transition.end, function() {
            if(dropzoneImageContainer.hasClass('faded')) {
                dropzone.css('height', 'auto');
            }
        });
    }
    
    lockControl.on('click', function(e) {
        if(!dropzoneImage) {
            e.stopPropagation();
            e.preventDefault();
        }
        setTimeout(function() {
            locked = lockControl.hasClass('active');
            setSelectionSize({
                height: 0,
                width: 0
            });
            selectionOuter.addClass('faded');
            if(locked) {
                heightWidthRatio = dropzonePos.height / dropzonePos.width;
                outputHeight = Math.floor(outputWidth * heightWidthRatio);
                heightControl.val(outputHeight);
                createBtn.removeAttr('disabled');
            }
            else {
                createBtn.attr('disabled', 'disabled');
            }
        }, 0);
    });
    
    resetBtn.on('click', function(e) {
        dropzoneContent.removeClass('faded');
        dropzoneImageContainer.addClass('faded');
        if(!$.support.transition) {
            dropzone.css('height', 'auto');
        }
        if(outputImage) {
            outputImage.remove();
            outputImage = null;
        }
        selectionOuter.addClass('faded');
        createBtn.attr('disabled', 'disabled');
        resetBtn.attr('disabled', 'disabled');
        downloadBtn.addClass('disabled');
        downloadBtn.removeAttr('href');
        selectionPos = {
            top:0, 
            left: 0, 
            width: 0, 
            height:0
        };
        locked = false;
        lockControl.removeClass('active');
		progress.css('width', 0);
    })
});