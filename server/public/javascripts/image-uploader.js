(function(){
  function dateDiff(oldDate){
    var now = new Date();
    var od = oldDate.split('-');
    oldDate = new Date(od[1]+'-'+od[0]+'-'+od[2]);
    now = new Date(now.getMonth()+1 + '-' + now.getDate() + '-' + now.getFullYear());
    var ret = (oldDate - now)/(1000*60*60*24)
    console.log(ret);
    return ret;
  }  

  $("#is-rent").on('click', function(){
    if($(this).is(':checked')){
      $(".hide-rent").show();
    }
    else {
      $(".hide-rent").hide();
    }
  });

  $('#type-of-house').on('change', function(){    
    if($(this).val()=='condo')
      $('.hide-condo').show()
    else
      $('.hide-condo').hide()
  });

  $('#accept').click(function(){
    if($('.is-agree').is(':checked')) {
      $('#agree-terms').val('yes');
    }
    else {
      alert("Plese accept terms and conditions.");
      return false;
    }
  });

  var totalShare = parseInt($('#totalShare').val());

  var soldShare = parseInt($('#soldShare').val());

  var availableShare = totalShare - soldShare;

  $('#availableShare').html('Available Share:' + '  ' + availableShare);
  
  $('#shares').keyup(function(){
    var shareToBuy = parseInt($('#shares').val());
    if((!isNaN(shareToBuy)) && (shareToBuy <= availableShare) && (shareToBuy > 0) ) {
      var netAmount = parseInt($('#shares').val() * $('#costPerShare').val());
      $('#amount').val(netAmount);
      $('#netAmount').html('$' + ' ' + netAmount);
    }
    else if( !isNaN(shareToBuy) && !($('#shares').val()=='') ){
      $('#shares').val('');
      $('#netAmount').html('$');
      alert("you can buy maximum " +''+ availableShare +' ' +'Shares');
    }
    else if($('#netAmount').val() === '' ) {
      $('#netAmount').html('$');
    }
  });
  
  $('#buy').on('click', function(event){
    if ($('#shares').val() === '' || (parseFloat($('#shares').val()) % 1 != 0)) {
      alert("Plese enter number of share or check if it is in decimal");
      return false;
    }
    else {
      return true;
    }
  });

  var currentPage = $('#currentPage').val();

  var city = $('#city').val();

  var pageLength = $('#numberOfPages').val();

  $('.' + currentPage).addClass('current');  

  $('.dot').css('display', 'none'); 
  
  $('.next').attr('href', '/house/'+city +'/'+currentPage); 

  if(pageLength > 5 ) {
    for (var i = 2; i < pageLength-1; i++) {
      $('.' + i).css('display', 'none');
      $('.dot').css('display', 'block');      
    };
  }

  $('#next').click(function() {
    if(pageLength > 5) {
      $('.dot').css('display', 'none');      
    }
    for (var i = 1; i < currentPage; i++) {
      $('.' +i).css('display', 'block');
    };
  })

  $('#updateDate').click(function() {
    var date = $('#biddingEndDate').val();
    var od = date.split('-');
    date = new Date(od[1]+'-'+od[0]+'-'+od[2]);

    if( ($('#biddingEndDate').val() == '')){
      alert('Select a valid date ');
      return false;
    }
    else if(dateDiff($('#biddingEndDate').val()) < 0){
      alert('Select a valid date');
      return false;
    }
  });
  
  $(".form_datetime").datetimepicker({
    format: "MM dd yyyy - hh:mm",
    autoclose: true,
    todayBtn: true,
    startDate: new Date(),
  });

  var onImageSelect = function (event) {
    var input = event.target;
    if (input.files && input.files[0]) {
      var reader = new FileReader();
      var name = $("input.house-pic:last").val();
      var extensions = ["JPEG", "JPG", "Exif", "TIFF", "RAW", "GIF", "BMP", "PNG", "PPM", "PGM", "PBM", "PNM", "PFM", "PAM", "WEBP"];
      var extension = name.substring(name.lastIndexOf('.') + 1).toLowerCase();
      var found = 0;
      for (var i = 0; i < extensions.length; i++) {
        if (extension.match((extensions[i]).toLowerCase())) {
          found = 1;
          break;
        }
        else
          found = 0;
      }
      if (found == 1) {
        reader.onload = function (e) {
          var aTag = document.createElement('a');
          aTag.setAttribute('class', 'house-pic house-del');
          aTag.setAttribute('rel', 'gallery');
          var imgTag = document.createElement('img');
          imgTag.setAttribute('class', 'house-pic house-del thumb');
          var inputTag = document.createElement('input');
          inputTag.setAttribute('class', 'house-pic house-del');
          inputTag.setAttribute('name', 'index');
          inputTag.setAttribute('hidden', 'true');
          inputTag.setAttribute('type', 'file');
          aTag.appendChild(imgTag);
          $('a.house-pic:last').after(aTag);
          $('input.house-pic:last').after(inputTag);
          $("input.house-pic:last").change(function(e){
            onImageSelect(e);
          });
          $('img.house-pic:last').attr('src', e.target.result);
          $('a.house-pic:last').attr('href', e.target.result);
          $('img.house-pic:last').css('height', '100px');
        }
        reader.readAsDataURL(input.files[0]);
      }
      else {
        $(".house-pic").val("");
        $('#preview').attr('src', "");
        alert("Please select correct image type");
      }
    }
  }

  $("#upload-pic-in").click(function (e) {
    e.preventDefault();
    e.stopImmediatePropagation();
    $("input.house-pic:last").trigger('click');
  });

  $("input.house-pic:last").change(function(e){
    onImageSelect(e);
  });

  var showInfo = function(message) {
    $('div.progress').hide();
    $('strong.message').text(message);
    $('div.alert').show();
  };

  $('.billDocument').change(function(e) {
    var file_list = e.target.files;
    for (var i = 0, file; file = file_list[i]; i++) {
      var sFileName = file.name;
      var sFileExtension = sFileName.split('.')[sFileName.split('.').length - 1].toLowerCase();
      if (!(sFileExtension === "pdf" || sFileExtension === "doc" || sFileExtension === "docx" || sFileExtension === "text")) {
        txt = "File type : " + sFileExtension + "\n\n";
        txt += "Your file is not in pdf or doc format";
        alert(txt);
        return false;
      }
      else {
        $('#taxesbills').text($('.billDocument').val().replace(/C:\\fakepath\\/i, ''));
      }
    }
  });

  $('.condoDocument').change(function(e) {
    var file_list = e.target.files;
    for (var i = 0, file; file = file_list[i]; i++) {
      var sFileName = file.name;
      var sFileExtension = sFileName.split('.')[sFileName.split('.').length - 1].toLowerCase();
      if (!(sFileExtension === "pdf" || sFileExtension === "doc" || sFileExtension === "docx" || sFileExtension === "text")) {
        txt = "File type : " + sFileExtension + "\n\n";
        txt += "Your file is not in pdf or doc format";
        alert(txt);
        return false;
      }
      else {
        $('#uploadcondodoc').text($('.condoDocument').val().replace(/C:\\fakepath\\/i, ''));
      }
    }
  });

  $('.rentReceivedDocument').change(function(e) {
    var file_list = e.target.files;
    for (var i = 0, file; file = file_list[i]; i++) {
      var sFileName = file.name;
      var sFileExtension = sFileName.split('.')[sFileName.split('.').length - 1].toLowerCase();
      if (!(sFileExtension === "pdf" || sFileExtension === "doc" || sFileExtension === "docx" || sFileExtension === "text")) {
        txt = "File type : " + sFileExtension + "\n\n";
        txt += "Your file is not in pdf or doc format";
        alert(txt);
        return false;
      }
      else {
        $('#monthlyrent').text($('.rentReceivedDocument').val().replace(/C:\\fakepath\\/i, ''));
      }
    }
  });

  $('.renovationDocument').change(function(e) {
    var file_list = e.target.files;
    for (var i = 0, file; file = file_list[i]; i++) {
      var sFileName = file.name;
      var sFileExtension = sFileName.split('.')[sFileName.split('.').length - 1].toLowerCase();
      if (!(sFileExtension === "pdf" || sFileExtension === "doc" || sFileExtension === "docx" || sFileExtension === "text")) {
        txt = "File type : " + sFileExtension + "\n\n";
        txt += "Your file is not in pdf or doc format";
        alert(txt);
        return false;
      }
      else {
        $('#renovationdoc').text($('.renovationDocument').val().replace(/C:\\fakepath\\/i, ''));
      }
    }
  });

  $('.floorPlanDocument').change(function(e) {
    var file_list = e.target.files;
    for (var i = 0, file; file = file_list[i]; i++) {
      var sFileName = file.name;
      var sFileExtension = sFileName.split('.')[sFileName.split('.').length - 1].toLowerCase();
      if (!(sFileExtension === "pdf" || sFileExtension === "doc" || sFileExtension === "docx" || sFileExtension === "text")) {
        txt = "File type : " + sFileExtension + "\n\n";
        txt += "Your file is not in pdf or doc format";
        alert(txt);
        return false;
      }
      else {
        $('#floorplan').text($('.floorPlanDocument').val().replace(/C:\\fakepath\\/i, ''));
        return true;
      }
    }
  });

  $('.ownershipDocument').change(function(e) {
    var file_list = e.target.files;
    for (var i = 0, file; file = file_list[i]; i++) {
      var sFileName = file.name;
      var sFileExtension = sFileName.split('.')[sFileName.split('.').length - 1].toLowerCase();
      if (!(sFileExtension === "pdf" || sFileExtension === "doc" || sFileExtension === "docx" || sFileExtension === "text")) {
        txt = "File type : " + sFileExtension + "\n\n";
        txt += "Your file is not in pdf or doc format";
        alert(txt);
        return false;
      }
      else {
        $('#ownershipdoc').text($('.ownershipDocument').val().replace(/C:\\fakepath\\/i, ''));
        return true;
      }
    }
  });

  $('.repairAndMaintenanceDocument').change(function(e) {
    var file_list = e.target.files;
    for (var i = 0, file; file = file_list[i]; i++) {
      var sFileName = file.name;
      var sFileExtension = sFileName.split('.')[sFileName.split('.').length - 1].toLowerCase();
      if (!(sFileExtension === "pdf" || sFileExtension === "doc" || sFileExtension === "docx" || sFileExtension === "text")) {
        txt = "File type : " + sFileExtension + "\n\n";
        txt += "Your file is not in pdf or doc format";
        alert(txt);
        return false;
      }
      else {
        $('#repair').text($('.repairAndMaintenanceDocument').val().replace(/C:\\fakepath\\/i, ''));
        return true;
      }
    }
  });

  $('.managementDocument').change(function(e) {
    var file_list = e.target.files;
    for (var i = 0, file; file = file_list[i]; i++) {
      var sFileName = file.name;
      var sFileExtension = sFileName.split('.')[sFileName.split('.').length - 1].toLowerCase();
      if (!(sFileExtension === "pdf" || sFileExtension === "doc" || sFileExtension === "docx" || sFileExtension === "text")) {
        txt = "File type : " + sFileExtension + "\n\n";
        txt += "Your file is not in pdf or doc format";
        alert(txt);
        return false;
      }
      else {
        $('#propertymanagement').text($('.managementDocument').val().replace(/C:\\fakepath\\/i, ''));
        return true;
      }
    }
  });  

  $('.biddingEndDate').keydown("false");
  $('#add-house').on('click', function(event){
    event.preventDefault();
    console.log('I AM HERE');
    var condoDoc = $(".condoDocument").val();
    var floorPlanDoc = $(".floorPlanDocument").val();
    var ownershipDoc = $(".ownershipDocument").val();
    var neighbourhood = $('.neighbourHood').val();
    var description = $('.description').val();
    var billDoc = $(".billDocument").val();
    var repairAndMaintenanceDoc = $(".repairAndMaintenanceDocument").val();
    var renovationDoc = $(".renovationDocument").val();
    var rentReceivedDoc = $(".rentReceivedDocument").val();
    var managementDoc = $(".managementDocument").val();
    var costOfShare = $('.costOfShare').val();
    var age = $('.age').val();
    var isRent = $('#is-rent').is(':checked');
    var houseNumber = $('.houseNumber').val();
    var streetNumber = $('.streetNumber').val();
    var pinCode = $('.pinCode').val();
    var monthlyRent = $('.monthlyRent').val();
    var monthlyCondo = $('.monthlyFee').val();
    var numberOfShare = $('.numberOfShare').val();
    var date = $('.biddingEndDate').val();
    var od = date.split('-');
    date = new Date(od[1]+'-'+od[0]+'-'+od[2]);
    
    if (condoDoc === '' && ($('#type-of-house').val() === 'condo')) {
      alert("upload condo document");
      return false;
    }

    if ( (monthlyCondo <= 0) && ($('#type-of-house').val() === 'condo')) {
      alert("upload condo document");
      return false;
    }
    else if($('input.house-pic').val() == ''){
      alert('Select a image');
      return false;
    }
    else if($('.city').val() == ''){
      console.log($('.city').val());
      alert('Select a city');
      return false;
    }
    else if(neighbourhood === ''){
      alert("Please fill the neighbourhood");
      return false;
    }
    else if(houseNumber === ''){
      alert("Please fill the house number");
      return false;
    }
    else if(streetNumber === ''){
      alert("Please fill the street number or street name");
      return false;
    }
    else if(pinCode === ''){
      alert("Please fill the pinCode");
      return false;
    }
    else if($('.typeOfHouse').val() == ''){
      alert('Select type of house');
      return false;
    }
    else if(floorPlanDoc === '') {
      alert("upload floorplan document");
      console.log("upload FLORR");
      return false;
    }
    else if(description === ''){
      alert("Please fill the description");
      return false;
    }
    else if(ownershipDoc === '') {
      alert("upload ownership document");
      console.log("upload OWNERSHIP");
      return false;
    }
    else if(billDoc === '') {
      console.log("upload BILL");
      alert("upload bill document");
      return false;
    }
    else if(age === '' || age.length < 4 || 
      (age.toString().slice(0,2) != 18 &&
      age.toString().slice(0,2) != 19 &&
      age.toString().slice(0,2) != 20)){
        alert("Please Fill The Age in format YYYY. eg. 1990");
        return false;
    }
    else if(repairAndMaintenanceDoc === '') {
      console.log("upload REPAIR");
      alert("upload repair and maintenence document");
      return false;
    }
    else if(renovationDoc === '') {
      console.log("upload RENOVATION");
      alert("upload renovation document");
      return false;
    }
    else if( isRent && rentReceivedDoc === '') {
      console.log("upload RENT RECIEVE");
      alert("upload rent received document");
      return false;
    }
    else if(isRent && managementDoc === '') {
      console.log("upload MANAGEMENT DOC");
      alert("upload management document");
      return false;
    }
    else if(isRent && (monthlyRent === '' || parseInt(monthlyRent) <= 0)) {
      console.log("monthly rent");
      alert("Please fill the monthly rent.");
      return false;
    }
    else if(numberOfShare == '' || parseInt(numberOfShare) <=0 || (parseFloat(numberOfShare) % 1 != 0) ){
      console.log("upload SHARE");
      alert("Please insert number of share or check if it is in decimal");
      return false;
    }
    else if(costOfShare === '' || parseInt(costOfShare) <= 0){
      console.log("upload COST");
      alert("Please insert cost of share");
      return false;
    }
    else if( $('.biddingEndDate').val() == ''){
      alert($('.biddingEndDate').val()+'  Select a valid date  ' + date);
      console.log("ERROR IS HERE");
      return false;
    }
    else{      
      $('div.progress.progress-light-blue').show();

      event.preventDefault();
      $('div.progress').show();
      var formData = new FormData($('#upload-form')[0]);

      var xhr = new XMLHttpRequest();

      xhr.open('post', '/addhouse', true);

      xhr.upload.onprogress = function(e) {

        if (e.lengthComputable) {
          $('.progress.progress-light-blue').show();
          console.log("ON PROGRESS");
          var percentage = (e.loaded / e.total) * 100;
          console.log(percentage);
          $('div.progress div.bar').css('width', percentage + '%');
        }
      };

      xhr.onerror = function(e) {
        console.log("ERROR IS  :: " + e);
        showInfo('An error occurred while submitting the form. Maybe your file is too big');
      };

      xhr.onload = function() {
        var reset = $("#upload-form").find('input[type=text], [type=number], textarea, input[type=file]');
        reset.attr('disabled', 'disabled');
        console.log("ON LOAD");
        showInfo(this.statusText);
      };

      xhr.onloadend = function(){
        console.log("COMPLETED");
        var reset = $("#upload-form").find('input[type=text], [type=number], textarea, input[type=file]');
        $('#uploadcondodoc').text(' Upload Condo Document');

        $('#floorplan').text('Upload Floor Plan Document');

        $('#ownershipdoc').text(' Upload Ownership Document ');

        $('#taxesbills').text(' Upload Taxes Bills Document ');

        $('#repair').text(' Upload Repair Document ');

        $('#renovationdoc').text(' Upload Renovation Document ');

        $('#monthlyrent').text(' Upload Monthly Rent Document');

        $('#propertymanagement').text(' Upload Property Management Document ');
        reset.val("");
        reset.removeAttr('disabled');
        $('a.house-del').remove();
        $('img.house-del').remove();
        $('input.house-del').remove();
        $('div.progress.progress-light-blue').hide();
        $('.alert-success').addClass(' alert alert-success animated fadeIn');
        $('.alert-success').html("Thank you ! Your form is successfully uploaded.");
      }

      xhr.send(formData);
      return false;
    }
  });
$(".menu").hover(
    function(){$(".sub").show();},
    function(){$(".sub").hide();}
  );
}())
