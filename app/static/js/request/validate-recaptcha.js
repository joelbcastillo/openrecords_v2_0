/**
 * Created by jyu on 10/21/16.
 */
function validateRecaptcha() {
    var captchaResponse = grecaptcha.getResponse();
    if (captchaResponse.length == 0) {
        // Captcha is not Passed
        document.getElementById("recaptcha-error").style.display = "block";
        return false;
    }
    else {
        // Captcha is Passed
        document.getElementById("recaptcha-error").style.display = "none";
        return true;
    }
}