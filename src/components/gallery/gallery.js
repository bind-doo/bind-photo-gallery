var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Component, State, Event, Method, Prop, Listen } from '@stencil/core';
import pinchit from 'pinchit/dist/pinchit.js';
let Gallery = class Gallery {
    constructor() {
        this.pageWidth = window.innerWidth || document.body.clientWidth;
        this.treshold = Math.max(1, Math.floor(0.01 * (this.pageWidth)));
        this.touchstartX = 0;
        this.touchstartY = 0;
        this.touchendX = 0;
        this.touchendY = 0;
        this.limit = Math.tan(45 * 1.5 / 180 * Math.PI);
        this.gestureZone = this.galleryImageElement;
        this.imagePreviewHideNav = { 'grid-template-columns': '100%' };
        this.hideNavStyle = { 'display': 'none' };
        this.rotatedImagesData = JSON.parse(sessionStorage.getItem('rotatedImages') || "[]") || [];
        this.images = [];
        this.imageStartIndex = 0;
        this.closeButton = false;
        this.rotateButton = true;
        this.imageWrapperStyle = { display: 'none' };
        this.galleryImageStyle = {};
        this.galleryWrapper = {};
    }
    handleEsc() {
        if (this.displayGrid) {
            this.displayGrid = false;
            return;
        }
        this._closeGallery();
    }
    handleRight() {
        if (!this.displayGrid)
            this.nextImage();
    }
    handleLeft() {
        if (!this.displayGrid)
            this.previousImage();
    }
    componentWillLoad() {
        if ('orientation' in screen) {
            this.deviceOrientation = window.screen.orientation;
        }
    }
    componentDidLoad() {
        this.setImage(this.imageStartIndex);
        if (this.rotatedImagesData.length >= 1) {
            this.images.forEach((image, index) => {
                const exists = this.rotatedImagesData.filter(item => item.index == index);
                if (exists.length) {
                    image['rotateAngle'] = exists[0].angle;
                }
            });
        }
        this.galleryImageContainer.addEventListener('touchstart', (event) => {
            this.touchstartX = event['changedTouches'][0].screenX;
            this.touchstartY = event['changedTouches'][0].screenY;
            this.touches = event['touches'].length;
        });
        this.galleryImageContainer.addEventListener('touchend', (event) => {
            this.touchendX = event['changedTouches'][0].screenX;
            this.touchendY = event['changedTouches'][0].screenY;
            if ((!this.displayGrid && this.touches === 1) && !(this.galleryImageElement.style.transform.includes('-'))) {
                this._handleGesture();
                this.touches = 0;
            }
            this.galleryImageElement.style.removeProperty('transform-origin');
        });
        pinchit(this.galleryImageContainer);
    }
    setImage(imageIndex) {
        if (imageIndex === this.imageIndex && !this.displayGrid)
            return;
        if (imageIndex === this.imageIndex && this.displayGrid) {
            this.displayGrid = false;
            return;
        }
        if (this.displayGrid)
            this.displayGrid = false;
        this.imageIndex = imageIndex;
        this.galleryImage = this.images[imageIndex];
        this.isImageLoading = true;
        this.imageWrapperStyle = { display: 'none' };
        this.onImageChange.emit(imageIndex);
    }
    previousImage() {
        if (this.images.length > 1) {
            if (this.imageIndex === 0) {
                this.setImage(this.images.length - 1);
            }
            else {
                this.setImage(this.imageIndex - 1);
            }
        }
    }
    nextImage() {
        if (this.images.length > 1) {
            if (this.imageIndex !== this.images.length - 1) {
                this.setImage(this.imageIndex + 1);
            }
            else {
                this.setImage(0);
            }
        }
    }
    imageLoaded() {
        this.galleryImageElement.style.transform = `rotate(${this.galleryImage['rotateAngle'] || 0}deg)`;
        ;
        this.isImageLoading = false;
        this.imageWrapperStyle = { display: 'grid' };
        this.galleryImageElement.removeAttribute('transform-origin');
    }
    openGridGallery() {
        this.displayGrid = true;
    }
    _displayLoadingSpinner() {
        if (this.isImageLoading) {
            return h("div", { class: "lds-roller" },
                h("div", null),
                h("div", null),
                h("div", null),
                h("div", null),
                h("div", null),
                h("div", null),
                h("div", null),
                h("div", null));
        }
    }
    _closeGallery() {
        this.onGalleryClose.emit(false);
    }
    _handleGesture() {
        let x = this.touchendX - this.touchstartX;
        let y = this.touchendY - this.touchstartY;
        let yx = Math.abs(y / x);
        if (Math.abs(x) > this.treshold || Math.abs(y) > this.treshold) {
            // IF left or right
            if (yx <= this.limit) {
                return (x < 0) ? this._goNextImageAnimated() : this._goPreviousImageAnimated();
            }
        }
    }
    _goNextImageAnimated() {
        if (this.images.length > 1) {
            this.galleryImageStyle = {
                '-webkit-animation': 'slide-right 0.5s cubic-bezier(0.250, 0.460, 0.450, 0.940) both',
                'animation': 'slide-right 0.5s cubic-bezier(0.250, 0.460, 0.450, 0.940) both'
            };
            setTimeout(() => {
                this.nextImage();
                this._clearGalleryImageStyle();
            }, 300);
        }
    }
    _goPreviousImageAnimated() {
        if (this.images.length > 1) {
            this.galleryImageStyle = {
                '-webkit-animation': 'slide-left 0.5s cubic-bezier(0.250, 0.460, 0.450, 0.940) both',
                'animation': 'slide-left 0.5s cubic-bezier(0.250, 0.460, 0.450, 0.940) both'
            };
            setTimeout(() => {
                this.previousImage();
                this._clearGalleryImageStyle();
            }, 300);
        }
    }
    _clearGalleryImageStyle() {
        this.galleryImageStyle = {};
    }
    _rotateImage(image) {
        this.galleryImageElement.removeAttribute('transform-origin');
        // setup rotate angle
        if (!this.galleryImage['rotateAngle'])
            this.galleryImage['rotateAngle'] = 0;
        (this.galleryImage['rotateAngle'] == 270) ? this.galleryImage['rotateAngle'] = 0 : this.galleryImage['rotateAngle'] += 90;
        // get current image index and rotateAngle in an object
        let imageData = { angle: this.galleryImage['rotateAngle'], index: this.images.indexOf(image) };
        // check if image with that index is already rotated and store the vlaue
        const exists = this.rotatedImagesData.filter(item => item.index == imageData.index);
        // if image already is rotated, will change that value, if not will push image to array and add to session storage
        if (this.rotatedImagesData.length && exists.length) {
            imageData.angle > 0 ? this.rotatedImagesData[this.rotatedImagesData.indexOf(exists[0])] = imageData : this.rotatedImagesData.splice(this.rotatedImagesData.indexOf(exists[0]), 1);
        }
        else {
            this.rotatedImagesData.push(imageData);
        }
        // set image width on rotate - ONLY DEVICES IN LANDSCAPE MODE 
        if (window.innerWidth < 1300 && this.deviceOrientation.angle != 0) {
            this.galleryImage['rotateAngle'] != 0 && this.galleryImage['rotateAngle'] != 180 ? this.galleryImageElement.style.width = '20rem' : this.galleryImageElement.style.width = '100%';
        }
        // set image width on rotate - ONLY DEVICES IN PORTRAIT MODE 
        if (window.innerWidth >= 772 && this.deviceOrientation.angle == 0) {
            this.galleryImage['rotateAngle'] != 0 && this.galleryImage['rotateAngle'] != 180 ? this.galleryImageElement.style.width = '40rem' : this.galleryImageElement.style.width = '100%';
        }
        // apply transformation to image element
        this.galleryImageElement.style.transform = `rotate(${this.galleryImage['rotateAngle'] || 0}deg)`;
        // set data
        sessionStorage.setItem('rotatedImages', JSON.stringify(this.rotatedImagesData));
    }
    _renderToolbarGrid() {
        if (this.displayGrid) {
            return h("div", { class: 'bc-gallery-grid-overlay', ref: element => this.gridOverlayElement = element },
                h("div", { class: "text-right" },
                    h("button", { class: 'bc-close-button', onClick: () => this.displayGrid = false })),
                h("div", { class: 'bc-gallery-grid' }, this.images.map((image, index) => {
                    return h("div", { class: 'bc-grid-image-container', onClick: () => this.setImage(index) },
                        h("img", { class: 'bc-grid-image', src: image.url, alt: "" }));
                })));
        }
        ;
    }
    _renderCloseButton() {
        if (this.closeButton) {
            return h("button", { class: 'bc-close-button', onClick: () => this._closeGallery() });
        }
        else {
            return h("div", null);
        }
    }
    _renderGridButton() {
        if (this.images.length >= 2) {
            return h("div", null,
                h("button", { class: 'bc-grid-button', onClick: () => this.openGridGallery() }));
        }
        else {
            return h("div", null);
        }
    }
    _renderRotateButton() {
        if (this.rotateButton) {
            return h("div", { onClick: () => this._rotateImage(this.galleryImage) },
                h("button", { class: 'bc-rotate-button' }),
                h("small", { class: "bc-rotate-text" }, "Rotate image"));
        }
        else {
            return h("div", null);
        }
    }
    _renderImagesNumber() {
        if (this.images.length >= 2) {
            return h("div", null,
                h("div", { class: 'bc-image-number' },
                    this.imageIndex + 1,
                    " / ",
                    this.images.length));
        }
        else {
            return h("div", null);
        }
    }
    render() {
        return (h("div", null,
            this._renderToolbarGrid(),
            h("div", { class: 'bc-gallery-wrapper' },
                h("div", { class: 'bc-top-toolbar' },
                    h("div", { class: 'bc-top-left' },
                        this._renderGridButton(),
                        this._renderImagesNumber()),
                    h("div", { class: "bc-top-middle text-center" }, this._renderRotateButton()),
                    h("div", { class: "bc-top-right text-right" }, this._renderCloseButton())),
                h("div", { class: 'bc-image-preview', style: this.images.length <= 1 ? this.imagePreviewHideNav : '' },
                    h("div", { class: 'bc-navigation', style: this.images.length <= 1 ? this.hideNavStyle : '', onClick: () => this.previousImage() },
                        h("button", { class: 'bc-navigation-left-button' })),
                    h("div", { class: 'bc-image-wrapper' },
                        this._displayLoadingSpinner(),
                        h("div", { class: 'bc-image-container', style: this.imageWrapperStyle, ref: element => this.galleryImageContainer = element },
                            h("img", { id: 'bc-gallery-image', class: 'bc-gallery-image', style: this.galleryImageStyle, ref: element => this.galleryImageElement = element, src: this.galleryImage && this.galleryImage.url ? this.galleryImage.url : null, onLoad: () => this.imageLoaded(), alt: "image" }))),
                    h("div", { class: 'bc-navigation', style: this.images.length <= 1 ? this.hideNavStyle : '', onClick: () => this.nextImage() },
                        h("button", { class: 'bc-navigation-right-button' }))),
                h("div", null,
                    h("p", { class: 'text-center bc-image-title' },
                        this.galleryImage && this.galleryImage.title ? h("span", null, this.galleryImage.title) : null,
                        this.galleryImage && this.galleryImage.description && this.galleryImage.title ? ' - ' : '',
                        this.galleryImage && this.galleryImage.description ? h("span", null,
                            " ",
                            this.galleryImage.description) : null)))));
    }
};
__decorate([
    Listen('window:keydown.escape')
], Gallery.prototype, "handleEsc", null);
__decorate([
    Listen('window:keydown.right')
], Gallery.prototype, "handleRight", null);
__decorate([
    Listen('window:keydown.left')
], Gallery.prototype, "handleLeft", null);
__decorate([
    Prop()
], Gallery.prototype, "images", void 0);
__decorate([
    Prop()
], Gallery.prototype, "imageStartIndex", void 0);
__decorate([
    Prop()
], Gallery.prototype, "closeButton", void 0);
__decorate([
    Prop()
], Gallery.prototype, "rotateButton", void 0);
__decorate([
    Event()
], Gallery.prototype, "onGalleryClose", void 0);
__decorate([
    Event()
], Gallery.prototype, "onImageChange", void 0);
__decorate([
    State()
], Gallery.prototype, "galleryImage", void 0);
__decorate([
    State()
], Gallery.prototype, "imageIndex", void 0);
__decorate([
    State()
], Gallery.prototype, "isImageLoading", void 0);
__decorate([
    State()
], Gallery.prototype, "displayGrid", void 0);
__decorate([
    State()
], Gallery.prototype, "imageWrapperStyle", void 0);
__decorate([
    State()
], Gallery.prototype, "galleryImageStyle", void 0);
__decorate([
    State()
], Gallery.prototype, "galleryWrapper", void 0);
__decorate([
    State()
], Gallery.prototype, "touches", void 0);
__decorate([
    Method()
], Gallery.prototype, "setImage", null);
__decorate([
    Method()
], Gallery.prototype, "previousImage", null);
__decorate([
    Method()
], Gallery.prototype, "nextImage", null);
__decorate([
    Method()
], Gallery.prototype, "imageLoaded", null);
__decorate([
    Method()
], Gallery.prototype, "openGridGallery", null);
Gallery = __decorate([
    Component({
        tag: 'bind-gallery',
        styleUrl: 'gallery.scss',
        shadow: false
    })
], Gallery);
export { Gallery };
