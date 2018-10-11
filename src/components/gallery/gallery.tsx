import { Component, State, Event, EventEmitter, Method, Prop, Listen } from '@stencil/core';
import { image } from './interfaces/interfaces';
import pinchit from 'pinchit/dist/pinchit.js';

@Component({
  tag: 'bind-gallery',
  styleUrl: 'gallery.scss',
  shadow: false
})
export class Gallery {

  public pageWidth: number = window.innerWidth || document.body.clientWidth;
  public treshold: number = Math.max(1, Math.floor(0.01 * (this.pageWidth)));
  public touchstartX: number = 0;
  public touchstartY: number = 0;
  public touchendX: number = 0;
  public touchendY: number = 0;

  public limit: number = Math.tan(45 * 1.5 / 180 * Math.PI);

  public galleryImageContainer: HTMLElement;
  public galleryImageElement: HTMLElement;
  public gridOverlayElement: HTMLElement;
  public gestureZone = this.galleryImageElement;
  public imagePreviewHideNav: any = { 'grid-template-columns': '100%' };
  public hideNavStyle: any = { 'display': 'none' };
  public rotatedImagesData: Array<any> = JSON.parse(sessionStorage.getItem('rotatedImages') || "[]") || [];

  @Listen('keydown')
  handleKeyDown(ev) {
    if (ev.key == 'Escape' && this.displayGrid) {
      this.displayGrid = false;
    }
  }

  @Prop() public images: Array<image> = [];
  @Prop() public imageStartIndex: number = 0;
  @Prop() public closeButton: boolean = false;

  @Event() onGalleryClose: EventEmitter;
  @Event() onImageChange: EventEmitter<number>;

  @State() public galleryImage: image;
  @State() public imageIndex: number;
  @State() public isImageLoading: boolean;
  @State() public displayGrid: boolean;
  @State() public imageWrapperStyle: any = { display: 'none' };
  @State() public galleryImageStyle: any = {};
  @State() public galleryWrapper: any = {};
  @State() public touches: number;

  componentWillLoad() {
  }

  componentDidLoad() {
    this.setImage(this.imageStartIndex);

    if (this.rotatedImagesData.length >= 1) {
      this.images.forEach((image, index) => {
        const exists = this.rotatedImagesData.filter(item => item.index == index);
        if (exists.length) { image['rotateAngle'] = exists[0].angle }
      });
    }

    this.galleryImageContainer.addEventListener('touchstart', (event) => {
      this.touchstartX = event['changedTouches'][0].screenX;
      this.touchstartY = event['changedTouches'][0].screenY;
      this.touches = event['touches'].length;
    });

    this.galleryImageContainer.addEventListener('touchend', (event) => {
      let elem = document.getElementById('bc-gallery-image');
      this.touchendX = event['changedTouches'][0].screenX;
      this.touchendY = event['changedTouches'][0].screenY;

      if ((!this.displayGrid && this.touches === 1) && !(elem['style'].transform.includes('-'))) {
        this._handleGesture();
        this.touches = 0;
      }
    });

    pinchit(this.galleryImageContainer);
  }

  @Method()
  public setImage(imageIndex: number): void {
    if (imageIndex === this.imageIndex) return;
    if (this.displayGrid) this.displayGrid = false;

    this.imageIndex = imageIndex;
    this.galleryImage = this.images[imageIndex];
    this.isImageLoading = true;
    this.imageWrapperStyle = { display: 'none' };
    this.onImageChange.emit(imageIndex);
  }

  @Method()
  public previousImage(): void {
    if (this.images.length > 1) {

      if (this.imageIndex === 0) {
        this.setImage(this.images.length - 1)
      } else {
        this.setImage(this.imageIndex - 1);
      }
    }
  }

  @Method()
  public nextImage(): void {
    if (this.images.length > 1) {

      if (this.imageIndex !== this.images.length - 1) {
        this.setImage(this.imageIndex + 1)
      } else {
        this.setImage(0);
      }
    }
  }

  @Method()
  public imageLoaded(): void {
    this.galleryImageElement.style.transform = `rotate(${this.galleryImage['rotateAngle'] || 0}deg)`;;
    this.isImageLoading = false;
    this.imageWrapperStyle = { display: 'initial' };
  }

  @Method()
  public openGridGallery(): void {
    this.displayGrid = true;
  }

  private _displayLoadingSpinner(): any {
    if (this.isImageLoading) {
      return <div class="lds-roller">
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
      </div>
    }
  }

  private _closeGallery(): void {
    this.onGalleryClose.emit(false);
  }

  private _handleGesture(): any {
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

  private _goNextImageAnimated(): void {
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

  private _goPreviousImageAnimated(): void {
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

  private _clearGalleryImageStyle(): void {
    this.galleryImageStyle = {};
  }

  private _rotateImage(image): void {
    // setup rotate angle
    if (!this.galleryImage['rotateAngle']) this.galleryImage['rotateAngle'] = 0;
    (this.galleryImage['rotateAngle'] == 270) ? this.galleryImage['rotateAngle'] = 0 : this.galleryImage['rotateAngle'] += 90;

    // get current image index and rotateAngle in an object
    let imageData = { angle: this.galleryImage['rotateAngle'], index: this.images.indexOf(image) }

    // check if image with that index is already rotated and store the vlaue
    const exists = this.rotatedImagesData.filter(item => item.index == imageData.index);

    // if image already is rotated, will change that value, if not will push image to array and add to session storage
    if (this.rotatedImagesData.length && exists.length) {
      imageData.angle > 0 ? this.rotatedImagesData[this.rotatedImagesData.indexOf(exists[0])] = imageData : this.rotatedImagesData.splice(this.rotatedImagesData.indexOf(exists[0]), 1);
    } else {
      this.rotatedImagesData.push(imageData);
    }

    // apply transformation to image element
    this.galleryImageElement.style.transform = `rotate(${this.galleryImage['rotateAngle']}deg)`;

    // set data
    sessionStorage.setItem('rotatedImages', JSON.stringify(this.rotatedImagesData));
  }

  private _renderToolbarGrid(): any {
    if (this.displayGrid) {
      return <div class='bc-gallery-grid-overlay' ref={element => this.gridOverlayElement = element}>
        <div class="text-right">
          <button class='bc-close-button' onClick={() => this.displayGrid = false}></button>
        </div>
        <div class='bc-gallery-grid'>
          {this.images.map((image, index) => {
            return <div class='bc-grid-image-container' onClick={() => this.setImage(index)}><img
              class='bc-grid-image' src={image.url} alt="" /></div>
          })}
        </div>
        <div class="clearfix"></div>
      </div>
    }
    ;
  }

  private _renderCloseButton(): any {
    if (this.closeButton) {
      return <button class='bc-close-button' onClick={() => this._closeGallery()}></button>

    } else {
      return <div></div>
    }
  }

  private _renderGridButton(): any {
    if (this.images.length >= 2) {
      return <div>
        <button class='bc-grid-button' onClick={() => this.openGridGallery()}></button>
      </div>
    } else {
      return <div></div>
    }
  }

  private _renderImagesNumber(): any {
    if (this.images.length >= 2) {
      return <div>
        <div class='bc-image-number'>{this.imageIndex + 1} / {this.images.length}</div>
      </div>
    } else {
      return <div></div>
    }
  }

  render() {

    return (
      <div>
        {this._renderToolbarGrid()}

        <div class='bc-gallery-wrapper'>
          <div class='bc-top-toolbar'>
            <div class='bc-top-left'>
              {this._renderGridButton()}
              {this._renderImagesNumber()}
            </div>
            <div class="bc-top-middle text-center">
              <button class='bc-rotate-button' onClick={() => this._rotateImage(this.galleryImage)}></button>
            </div>
            <div class="bc-top-right text-right">
              {this._renderCloseButton()}
            </div>
          </div>

          <div class='bc-image-preview' style={this.images.length <= 1 ? this.imagePreviewHideNav : ''}>
            <div class='bc-navigation' style={this.images.length <= 1 ? this.hideNavStyle : ''} onClick={() => this.previousImage()}>
              <button class='bc-navigation-left-button'></button>
            </div>

            <div class='bc-image-wrapper'>
              {this._displayLoadingSpinner()}
              <div class='bc-image-wrapper' style={this.imageWrapperStyle}
                ref={element => this.galleryImageContainer = element}>
                <img id='bc-gallery-image' class='bc-gallery-image' style={this.galleryImageStyle}
                  ref={element => this.galleryImageElement = element}
                  src={this.galleryImage && this.galleryImage.url ? this.galleryImage.url : null}
                  onLoad={() => this.imageLoaded()}
                  alt="image" />
              </div>
            </div>

            <div class='bc-navigation' style={this.images.length <= 1 ? this.hideNavStyle : ''} onClick={() => this.nextImage()}>
              <button class='bc-navigation-right-button'></button>
            </div>
          </div>

          <div>
            <p class='text-center bc-image-title'>
              {this.galleryImage && this.galleryImage.title ? <span>{this.galleryImage.title}</span> : null}
              {this.galleryImage && this.galleryImage.description && this.galleryImage.title ? ' - ' : ''}
              {this.galleryImage && this.galleryImage.description ? <span> {this.galleryImage.description}</span> : null}
            </p>
          </div>
        </div>
      </div>
    );
  }
}
