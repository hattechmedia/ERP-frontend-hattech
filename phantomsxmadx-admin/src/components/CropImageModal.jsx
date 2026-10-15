import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { FiX, FiCheck, FiRotateCw, FiZoomIn } from 'react-icons/fi';

const CropImageModal = ({ image, onCropComplete, onCancel }) => {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

    const onCropChange = (crop) => {
        setCrop(crop);
    };

    const onCropCompleteInternal = useCallback((croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const createImage = (url) =>
        new Promise((resolve, reject) => {
            const image = new Image();
            image.addEventListener('load', () => resolve(image));
            image.addEventListener('error', (error) => reject(error));
            image.setAttribute('crossOrigin', 'anonymous');
            image.src = url;
        });

    const getCroppedImg = async (imageSrc, pixelCrop, rotation = 0) => {
        const image = await createImage(imageSrc);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        const maxSize = Math.max(image.width, image.height);
        const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));

        canvas.width = safeArea;
        canvas.height = safeArea;

        ctx.translate(safeArea / 2, safeArea / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.translate(-safeArea / 2, -safeArea / 2);

        ctx.drawImage(
            image,
            safeArea / 2 - image.width * 0.5,
            safeArea / 2 - image.height * 0.5
        );

        const data = ctx.getImageData(0, 0, safeArea, safeArea);

        canvas.width = pixelCrop.width;
        canvas.height = pixelCrop.height;

        ctx.putImageData(
            data,
            Math.round(0 - safeArea / 2 + image.width * 0.5 - pixelCrop.x),
            Math.round(0 - safeArea / 2 + image.height * 0.5 - pixelCrop.y)
        );

        return canvas.toDataURL('image/jpeg');
    };

    const handleDone = async () => {
        try {
            const croppedImage = await getCroppedImg(image, croppedAreaPixels, rotation);
            onCropComplete(croppedImage);
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-[var(--bg-card)] w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl border border-[var(--border-color)]">
                <div className="p-6 border-b border-[var(--border-color)] flex items-center justify-between">
                    <h3 className="text-xl font-bold text-[var(--text-primary)]">Crop Profile Image</h3>
                    <button onClick={onCancel} className="p-2 hover:bg-[var(--bg-main)] rounded-xl transition-colors text-gray-400">
                        <FiX size={24} />
                    </button>
                </div>

                <div className="relative h-[400px] w-full bg-[#1a1a1a]">
                    <Cropper
                        image={image}
                        crop={crop}
                        zoom={zoom}
                        rotation={rotation}
                        aspect={1}
                        onCropChange={onCropChange}
                        onCropComplete={onCropCompleteInternal}
                        onZoomChange={setZoom}
                        cropShape="round"
                        showGrid={true}
                    />
                </div>

                <div className="p-6 space-y-6">
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <FiZoomIn className="text-gray-400" />
                            <input
                                type="range"
                                value={zoom}
                                min={1}
                                max={3}
                                step={0.1}
                                aria-labelledby="Zoom"
                                onChange={(e) => setZoom(e.target.value)}
                                className="w-full h-2 bg-[var(--bg-main)] rounded-lg appearance-none cursor-pointer accent-[#004AAE]"
                            />
                        </div>
                        <div className="flex items-center gap-4">
                            <FiRotateCw className="text-gray-400" />
                            <input
                                type="range"
                                value={rotation}
                                min={0}
                                max={360}
                                step={1}
                                aria-labelledby="Rotation"
                                onChange={(e) => setRotation(e.target.value)}
                                className="w-full h-2 bg-[var(--bg-main)] rounded-lg appearance-none cursor-pointer accent-[#004AAE]"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-4 pt-2">
                        <button
                            onClick={onCancel}
                            className="flex-1 px-6 py-3 rounded-xl bg-[var(--bg-main)] text-[var(--text-primary)] font-bold hover:bg-[var(--border-color)] transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleDone}
                            className="flex-1 px-6 py-3 rounded-xl bg-[#004AAE] text-white font-bold hover:bg-[#003882] shadow-lg shadow-[#004AAE]/25 transition-all flex items-center justify-center gap-2"
                        >
                            <FiCheck />
                            Done Clipping
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CropImageModal;
