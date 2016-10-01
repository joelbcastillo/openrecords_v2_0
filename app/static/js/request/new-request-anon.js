/**
 * Created by atan on 9/14/16.
 */
$(document).ready(function () {
    $('[data-toggle="popover"]').popover();

    // Prevent user from entering a non numeric value into phone and fax field
    $('#phone').keypress(function(key) {
        if (key.charCode != 0){
            if (key.charCode < 48 || key.charCode > 57) {
                key.preventDefault();
            }
        }
    });
    $('#fax').keypress(function(key) {
        if (key.charCode != 0){
            if (key.charCode < 48 || key.charCode > 57) {
                key.preventDefault();
            }
        }
    });

    // javascript to add tooltip popovers when selecting the title and description
    $('#request-title').attr({
            'data-placement': "top",
            'data-trigger': "focus",
            'data-toggle': "popover",
            'data-content': "Public Advocate Emails from 2015",
            title: "Example Title"
    });
    $('#request-title').click(function(){
        $('#request-title').popover('show');
    });
    $('#request-description').attr({
            'data-placement': "top",
            'data-trigger': "focus",
            'data-toggle': "popover",
            'data-content': "Topic: Public Advocate Emails from 2015. Emails that mention bike lanes or bicycle lanes from the Public Advocate's Office between July 27, 2015 and September 10, 2015.",
            title: "Example Request"
    });
    $('#request-description').click(function(){
        $('#request-description').popover('show');
    });

    // jQuery mask plugin to format fields
    $('#phone').mask("(999) 999-9999");
    $('#fax').mask("(999) 999-9999");
    $('#zipcode').mask("99999");

    // Apply parsley validation styles to the input forms for a new request.

    // Loop through required fields and apply a data-parsley-required attribute to them
    var required_fields = ['request-title','request-description', 'request-agency', 'first-name','last-name','email',
        'phone','fax','address-line-1', 'city', 'zipcode'];
    for (i = 0 ; i < required_fields.length ; i++){
        $('#' + required_fields[i]).attr('data-parsley-required','');
    }

    // Specify length requirement of certain fields
    $('#request-title').attr('data-parsley-maxlength', 90);
    $('#request-description').attr('data-parsley-maxlength', 5000);
    $('#phone').attr('data-parsley-length','[14,14]');
    $('#fax').attr('data-parsley-length','[14,14]');
    $('#zipcode').attr('data-parsley-length', '[5,5]');

    // Custom Validation Messages
    $('#fax').attr('data-parsley-length-message', 'The fax number must be 10 digits.');
    $('#phone').attr('data-parsley-length-message', 'The phone number must be 10 digits.');
    $('#zipcode').attr('data-parsley-length-message', 'The Zipcode must be 5 digits.');

    // Disable default error messages for email,phone,fax,address so custom one can be used instead.
    $('#phone').attr('data-parsley-required-message', '');
    $('#fax').attr('data-parsley-required-message', '');
    $('#address-line-1').attr('data-parsley-required-message', '');
    $('#city').attr('data-parsley-required-message','');
    $('#email').attr('data-parsley-required-message', '');
    $('#zipcode').attr('data-parsley-required-message','');

    // Limit the size of the file upload to 20 Mb. Second parameter is number of Mb's.
    $('#request-file').attr('data-parsley-max-file-size',"20");

    // Contact information validation
    $('#email').attr('data-parsley-type', 'email');
    // Checks that at least one form of contact was filled out in addition to the rest of the form.
    $('#request-form').parsley().subscribe('parsley:form:validate', function () {
        // Re-apply validators to fields in the event that they were removed from previous validation requests.
        for (i = 0 ; i < required_fields.length ; i++){
           $('#' + required_fields[i]).attr('data-parsley-required','');
        }
        // If address is filled out then make sure the city, state, and zipcode are filled.
        if ($('#address-line-1').parsley().isValid()){
                $('#city').attr('data-parsley-required','');
                $('#state').attr('data-parsley-required','');
                $('#zipcode').attr('data-parsley-required','');
            }
        // Checks that at least one of the contact information fields is filled in addition to the rest of the form
        if ($('#email').parsley().isValid() ||
            $('#phone').parsley().isValid() ||
            $('#fax').parsley().isValid() ||
            ($('#address-line-1').parsley().isValid() && $('#state').parsley().isValid() && $('#zipcode').parsley().isValid() && $('#city').parsley().isValid())
            &&
            ($('#request-agency').parsley().isValid() &&
            $('#request-title').parsley().isValid() &&
            $('#request-description').parsley().isValid() &&
            $('#first-name').parsley().isValid() &&
            $('#last-name').parsley().isValid())
        ) {
                // If at least one of the fields are validated then remove required from the rest of the contact fields that aren't being filled out
                $('#city').removeAttr('data-parsley-required');
                $('#state').removeAttr('data-parsley-required');
                $('#zipcode').removeAttr('data-parsley-required');
                $('#phone').removeAttr('data-parsley-required');
                $('#fax').removeAttr('data-parsley-required');
                $('#address-line-1').removeAttr('data-parsley-required');
                $('#email').removeAttr('data-parsley-required');
        }
        else {
            // If none of the fields are valid then produce an error message and apply required fields.
            $('.contact-form-error-message').html("*At least one of the following must be filled out: Email, Phone, Fax, and/or Address (with City, State, and Zipcode)");
            $('#fax').attr('data-parsley-required', '');
            $('#phone').attr('data-parsley-required', '');
            $('#address-line-1').attr('data-parsley-required', '');
            $('#email').attr('data-parsley-required', '');
        }
    });

});

