$(function() {

  var initImportJobForm = function() {
    var $form = $('#jobfileupload');

    $(".btn:submit", $form).on("click", function(event) {
      event.stopPropagation();
      event.preventDefault();

      $form.submit();
    });


    var initFileUploadSection = function() {
      var $dropContainer = $("#files");

      var handleFileInputChange = function() {
        var $input = $(this);
        var filename = $input.val().split("\\").reverse()[0]
        var $file_html = $(AS.renderTemplate("template_import_file", {filename: filename}));

        $file_html.append($input);
        var $clone = $input.clone();
        $clone.on("change", handleFileInputChange);
        $(".fileinput-button", $form).append($clone);

        $dropContainer.append($file_html);
      };

      $(":file", $form).on("change", handleFileInputChange);

      $dropContainer.on("click", ".btn-remove-file", function() {
        $(this).closest(".import-file").remove();
      });

      $dropContainer.on('dragenter', function (e) {
        e.stopPropagation();
        e.preventDefault();
        $(this).addClass("active");
      }).on('dragover', function (e) {
            e.stopPropagation();
            e.preventDefault();
          }).on('dragleave', function (e) {
            e.stopPropagation();
            e.preventDefault();

            $(this).removeClass("active");
          }).on('drop', function (event) {
            $(this).removeClass("incoming").removeClass("active");

            $.each(event.originalEvent.dataTransfer.files, function(i ,file) {
              var $file_html = $(AS.renderTemplate("template_import_file", {filename: file.name}));
              $file_html.data("file", file);
              $file_html.addClass("file-attached");

              $dropContainer.append($file_html);
            });
          });

      // Only allow drop into the #files container
      $(document).on('dragenter', function (e) {
        e.stopPropagation();
        e.preventDefault();

        $dropContainer.addClass("incoming");

      }).on('dragover', function (e) {
            e.stopPropagation();
            e.preventDefault();

            $dropContainer.addClass("incoming");
          }).on('dragleave', function (e) {
            e.stopPropagation();
            e.preventDefault();

            $dropContainer.removeClass("incoming");
          }).on('drop', function (e) {
            e.stopPropagation();
            e.preventDefault();

            $dropContainer.removeClass("incoming").removeClass("active");
          });
    };

    $("#job_import_type_", $form).change(function() {
      if ($(this).val() === "") {
        $("#noImportTypeSelected", $form).show();
        $("#job_filenames_", $form).hide();

      } else {
        $("#noImportTypeSelected", $form).hide();
        $("#job_filenames_", $form)
            .empty()
            .append(AS.renderTemplate("template_fileupload"))
            .slideDown();

        var fileFormat;
        if ($(this).val().indexOf("csv") >= 0) {
          fileFormat = "csv";
        } else if ($(this).val().indexOf("xml") >= 0) {
          fileFormat = "xml";
        }

        initFileUploadSection(fileFormat);
      }
    });
    $("#job_import_type_", $form).trigger("change");

    var handleError = function(errorHTML) {
      $(".content-pane > .container").html(errorHTML);
      initImportJobForm();
    };

    var $progress = $("#uploadProgress", $form)
    var $progressBar = $(".bar", $progress)

    $form.ajaxForm({
      type: "POST",
      beforeSubmit: function(arr, $form, options) {
        $(".btn, a, :input", $form).attr("disabled", "disabled").addClass("disabled");
        $progress.show();
        $(".import-file.file-attached").each(function() {
          var $input = $(this);
          arr.push({
            name: "files[]",
            type: "file",
            value: $input.data("file")
          });
        });
      },
      uploadProgress: function(event, position, total, percentComplete) {
        var percentVal = percentComplete + '%';
        $progressBar.width(percentVal)
        //percent.html(percentVal);
      },
      success: function(json, status, xhr) {
        var uri_to_resolve;
        if (typeof json === "string") {
          // In IE8 (older browsers), AjaxForm will use an iframe to deliver this POST.
          // When using an iframe it cannot handle JSON as a response type... so let us
          // grab the HTML string returned and parse it.
          var $responseFromIFrame = $(json);

          if ($responseFromIFrame.is("textarea")) {
            if ($responseFromIFrame.data("type") === "html") {
              // it must of errored
              return handleError($responseFromIFrame.val());
            } else if ($responseFromIFrame.data("type") === "json") {
              var fooJSON = JSON.parse($responseFromIFrame.val());
              uri_to_resolve = fooJSON.uri;
            } else {
              throw "jobs.crud: textarea.data-type not currently support - " + $responseFromIFrame.data("type");
            }
          } else {
            throw "jobs.crud: the response text should be wrapped in a textarea for the plugin AjaxForm support";
          }
        } else {
          uri_to_resolve = json.uri;
        }

        var percentVal = '100%';
        $progressBar.width(percentVal)
        $progress.removeClass("active").removeClass("progress-striped");
        $progressBar.addClass("bar-success");
        $("#successMessage").show();

        location.href = APP_PATH + "resolve/readonly?uri="+uri_to_resolve;
      },
      error: function(xhr) {
        handleError(xhr.responseText);
      },
      complete: function(xhr) {
        //console.log(xhr);
      }
    });
  };

  initImportJobForm();
});