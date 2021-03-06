import { HomePage } from "./../home/home";
import { API_CONFIG } from "./../../config/api.config";
import { ClienteService } from "./../../services/domain/cliente.service";
import { ClienteDTO } from "./../../models/cliente.dto";
import { localUser } from "./../../models/local_user";
import { Component } from "@angular/core";
import { IonicPage, NavController, NavParams } from "ionic-angular";
import { StorageService } from "../../services/storage.service";
import { CameraOptions, Camera } from "@ionic-native/camera";
import { ImageUtilService } from "../../services/image-util.service";
import { DomSanitizer } from "@angular/platform-browser";

@IonicPage()
@Component({
  selector: "page-profile",
  templateUrl: "profile.html"
})
export class ProfilePage {
  cliente: ClienteDTO;
  picture: string; //base64 | binário
  cameraOn: boolean = false;
  profileImage;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public storage: StorageService,
    public clienteService: ClienteService,
    public camera: Camera,
    public imageService: ImageUtilService,
    public sanitizer: DomSanitizer
  ) {
    this.profileImage = "assets/imgs/avatar-blank.png";
  }

  ionViewDidLoad() {
    this.loadData();
  }

  private loadData() {
    let localUser = this.storage.getLocalUser();
    if (localUser && localUser.email) {
      this.clienteService.findByEmail(localUser.email).subscribe(
        response => {
          this.cliente = response as ClienteDTO;
          this.getImageIfExists();
        },
        error => {
          if (error.status == 403) {
            this.navCtrl.setRoot("HomePage");
          }
        }
      );
    } else {
      this.navCtrl.setRoot("HomePage");
    }
  }

  getImageIfExists() {
    this.clienteService.getImageFromBucket(this.cliente.id).subscribe(
      response => {
        this.cliente.imageUrl = `${API_CONFIG.bucketBaseUrl}/cp${this.cliente.id}.jpg`;

        this.imageService.blobToDataUri(response).then(dataUrl => {
          let img: string = dataUrl as string;
          this.profileImage = this.sanitizer.bypassSecurityTrustUrl(img);
        });
      },
      error => {
        this.profileImage = "assets/imgs/avatar-blank.png";
      }
    );
  }

  getCameraPicture() {
    this.cameraOn = true;
    const options: CameraOptions = {
      quality: 100,
      destinationType: this.camera.DestinationType.DATA_URL,
      encodingType: this.camera.EncodingType.PNG,
      mediaType: this.camera.MediaType.PICTURE
    };

    this.camera
      .getPicture(options)
      .then(imageData => {
        this.picture = "data:image/png;base64," + imageData;
        this.cameraOn = false;
      })
      .catch(error => {
        this.cameraOn = false;
      });
  }

  sendPicture() {
    this.clienteService.uploadPicture(this.picture).subscribe(
      response => {
        this.picture = null;
        this.getImageIfExists();
      },
      error => {}
    );
  }

  cancel() {
    this.picture = null;
  }
}
