import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
// import { DataService } from '../service/data.service'

import { Observable } from 'rxjs';
import { SharedService } from '../service/shared.service';
import { NgxSpinnerService } from 'ngx-spinner'
import { NotificationService } from '../service/notification.service'
import { analyzeAndValidateNgModules } from '@angular/compiler';
import { environment } from 'src/environments/environment';
import { data } from 'jquery';
import { CookieService } from 'ngx-cookie-service';
import { ProvisionService } from '../provision/provision.service';
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  Url = environment.apiURL
  loginForm: FormGroup;
  errormsg: any;
  returnUrl: string;
  mail_flag: any;
  otp_flag = false;
  mobile_flag = false;
  count = 100;
  timeout: any;
  mobile_form: FormGroup;
  ips: any;
  otp2: boolean;
  session_data: any;
  mobile_num: any;
  constructor(private dataService: ProvisionService, private router: Router, private SpinnerService: NgxSpinnerService, private notification: NotificationService,
    private sharedService: SharedService, public cookieService: CookieService,
    private formBuilder: FormBuilder, private route: ActivatedRoute) { }

  ngOnInit() {
    this.loginForm = this.formBuilder.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
    });

    this.mobile_form = this.formBuilder.group({
      mobile_number: [''],
      otp: [''],
      mobile_num: ['']
    })
    // get return url from route parameters or default to '/'
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/kvb';
    const item = localStorage.getItem("sessionData");
    this.route.queryParams
      .subscribe(params => {
        this.mail_flag = params.from;
      }
      );
    if (item !== null) {
      let itemValue = JSON.parse(item);
      this.sharedService.Loginname = itemValue.name;
      this.sharedService.isLoggedin = true;
      this.sharedService.loginUserId = itemValue.user_id;
      this.sharedService.loginEmpId = itemValue.employee_id;
      if (this.mail_flag == 'email' || this.mail_flag == 'remsemail') {
        //  this.getMenuUrl();
        this.sharedService.titleUrl = '';
      } else {
        this.getMenuUrl();
      }
    }
  }//endof oninit

  private getMenuUrl() {
    this.dataService.getMenuUrl()
      .subscribe((results: any[]) => {
        let data = results['data'];
        if (data[0].url==='/memosummary'){
          this.sharedService.titleUrl = '/ememo/memosummary';
        }else{
        this.sharedService.titleUrl = data[0].url;
      }
        this.sharedService.menuUrlData = data;
        this.router.navigateByUrl(this.sharedService.titleUrl, { skipLocationChange: true });
      })
  }

  login() {
    localStorage.removeItem("memosearch_data")
    localStorage.removeItem("ls_approvaltypeiom");
    localStorage.removeItem("ls_approvaltype");
    this.dataService.login(this.loginForm.value)
      .subscribe(datas => {
        this.session_data = datas;
        if (datas.id) {
          this.dataService.Finduserlocation(datas.token, datas.id)
            .then(data => {
              if (data.status == false) {
                this.mobile_flag = true;
                this.mobile_form.get('mobile_number').setValue(data.mobile_number);
                this.mobile_num = data.mobile_number
                this.mobile_num = 'XXXXXX' + this.mobile_num.toString()
                this.mobile_form.get('mobile_num').setValue(this.mobile_num);
                this.gen_otp()
                localStorage.setItem("location", JSON.stringify(this.mobile_flag))
                this.sharedService.loginEmpId = datas.employee_id;
                return true;
              }
              else if (data.user_id) {
                this.mobile_flag = false;
                localStorage.setItem("sessionData", JSON.stringify(data))
                this.cookieService.set("my-key", JSON.stringify(data))
                localStorage.setItem("location", JSON.stringify(this.mobile_flag))
                const item = localStorage.getItem("sessionData");
                this.sharedService.Loginname = data.name;
                this.sharedService.isLoggedin = true;
                this.sharedService.loginUserId = data.user_id;
                this.sharedService.loginEmpId = data.employee_id;
                this.sharedService.get_userlocation.next(this.mobile_flag)
                this.router.navigateByUrl(this.returnUrl, { skipLocationChange: true });
                return true;
              }
              // this.SpinnerService.hide();
            })
        }
        else if (datas.user_id) {
          this.mobile_flag = false;
          console.log("datas===>",datas)
          localStorage.setItem("sessionData", JSON.stringify(datas))
          this.cookieService.set("my-key", JSON.stringify(datas))
          localStorage.setItem("location", JSON.stringify(this.mobile_flag))
          const item = localStorage.getItem("sessionData");
          this.sharedService.Loginname = datas.name;
          this.sharedService.isLoggedin = true;
          this.sharedService.loginUserId = datas.user_id;
          this.sharedService.loginEmpId = datas.employee_id;
          this.sharedService.get_userlocation.next(this.mobile_flag)
          this.router.navigateByUrl(this.returnUrl, { skipLocationChange: true });
          return true;
        }
        console.log("my-key", this.cookieService.get("my-key"));
      }
      )



  }

  gen_otp() {
    this.mobile_form.get('otp').setValue('');
    this.count = 35;
    let mob = this.mobile_form.value.mobile_number
    this.timeout = setInterval(() => {
      if (this.count > 0) {
        this.count -= 1;
      } else {
        clearInterval(this.timeout);
      }
    }, 500);
    if (mob.toString().length == 3) {
      this.otp_flag = true;
      this.dataService.gen_otp(this.mobile_form.value, 'gen_OTP', this.session_data.id, '')
        .then(data => {
          if (data['validation_status'].Status == 'Success') {
          } else {
            if (data['validation_status'].Description) {
              this.notification.showWarning(data['validation_status'].Description)
            }
            else {
              this.notification.showWarning(data['validation_status'].ErrorMessage)
            }
            // this.otp_flag=false;
            localStorage.removeItem("sessionData");
            this.sharedService.isLoggedin = false;
            // this.otp2=false;
          }
        }).finally(function () {
        });
    }
    else {
      this.mobile_flag = false;
      // this.otp2=false;
      this.notification.showWarning("You are trying to login from outside KVB environment.Kindly access the App via KVB environment and update your mobile number in the xxxxxxxxxx for getting the OTP")
    }
    // this.SpinnerService.hide(); 
  }
  
  mobilelogin() {
    this.dataService.gen_otp(this.mobile_form.value, 'validate_OTP', this.session_data.id, '')
      .then(data => {
        if (data.user_id) {
          this.session_data = data;
          localStorage.setItem("sessionData", JSON.stringify(data))
          this.cookieService.set("my-key", JSON.stringify(data))
          localStorage.setItem("location", JSON.stringify(this.mobile_flag))
          const item = localStorage.getItem("sessionData");
          this.sharedService.Loginname = this.session_data.name;
          this.sharedService.isLoggedin = true;
          this.sharedService.loginUserId = this.session_data.user_id;
          this.sharedService.loginEmpId = this.session_data.employee_id;
          this.sharedService.get_userlocation.next(this.mobile_flag)
          this.getMenuUrl();
          this.router.navigateByUrl(this.returnUrl, { skipLocationChange: true });
          return true;
        }
        else {
          if (data['validation_status'].Description) {
            this.notification.showWarning(data['validation_status'].Description)
          }
          else {
            this.notification.showWarning('Unauthorized Request')
          }
          localStorage.removeItem("sessionData");
          this.sharedService.isLoggedin = false;
        }
      })
  }
}