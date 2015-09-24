 /*
 * Use this directive to convert drop downs into chosen drop downs.
 * http://harvesthq.github.io/chosen/
 * http://adityasharat.github.io/angular-chosen/
 */
(function (angular) {
  var AngularChosen = angular.module('angular.chosen', []);


  function chosen($timeout) {
    var EVENTS, scope, linker, watchCollection;

    /*
     * List of events and the alias used for binding with angularJS
     */
    EVENTS = [{
      onChange: 'change'
    }, {
      onReady: 'chosen:ready'
    }, {
      onMaxSelected: 'chosen:maxselected'
    }, {
      onShowDropdown: 'chosen:showing_dropdown'
    }, {
      onHideDropdown: 'chosen:hiding_dropdown'
    }, {
      onNoResult: 'chosen:no_results'
    }];

    /*
     * Items to be added in the scope of the directive
     */
    scope = {
      options: '=', // the options array
      ngModel: '=', // the model to bind to,,
      ngDisabled: '='
    };

    /*
     * initialize the list of items
     * to watch to trigger the chosen:updated event
     */
    watchCollection = [];
    Object.keys(scope).forEach(function (scopeName) {
      watchCollection.push(scopeName);
    });

    /*
     * Add the list of event handler of the chosen
     * in the scope.
     */
    EVENTS.forEach(function (event) {
      var eventNameAlias = Object.keys(event)[0];
      scope[eventNameAlias] = '=';
    });

    /* Linker for the directive */
    linker = function ($scope, iElm, iAttr) {
      var maxSelection = parseInt(iAttr.maxSelection, 10),
        searchThreshold = parseInt(iAttr.searchThreshold, 10);

      if (isNaN(maxSelection) || maxSelection === Infinity) {
        maxSelection = undefined;
      }

      if (isNaN(searchThreshold) || searchThreshold === Infinity) {
        searchThreshold = undefined;
      }

      var allowSingleDeselect = iElm.attr('allow-single-deselect') !== undefined ? true : false;

      var addDataOption = false;

      if (iElm.attr('data-add-option') || iElm.attr('data-add-url')) {
        addDataOption = function(term) {
          var chosen = this;

          var confirmOptions = {
            title: 'Are you sure?',
            text: 'Are you sure you want to to add this option?',
            type: 'info',
            showCancelButton: true,
            confirmButtontext: 'Yes',
            cancelButtonText: 'Cancel',
            closeOnConfirm: false,
            closeOnCancel: true,
            'callback': function(isConfirm){
              if(isConfirm) {
                var dd_model = chosen.form_field_jq.data('add-option');
                var data_url = chosen.form_field_jq.data('add-url');
                var url = api_prefix + 'dd';
                if(data_url != null){
                  url = data_url;
                }

                // check to see if there's a releates to data object
                var relatesToSelector = chosen.form_field_jq.data('relates-to');
                if(relatesToSelector != null){ // post with relatedid

                  $.post(url, {name: term, relatedId: $(relatesToSelector).val(), _token: $('meta[name="_token"]').attr('content'), model: dd_model}, function(data){
                    chosen.append_option({
                      value: data.id,
                      text: data.name
                    });
                    swal('Added', 'Option added', 'success');
                  });

                }else{ // otherwise post as normal
                  $.post(url, {name: term, _token: $('meta[name="_token"]').attr('content'), model: dd_model}, function(data){
                    chosen.append_option({
                      value: data.id,
                      text: data.name
                    });
                    swal('Added', '"' + data.name + '" option added', 'success');
                  });
                }
              }
            }
          };

          ppnotify('confirm', confirmOptions);


        }
      }

      iElm.chosen({
        width: '100%',
        max_selected_options: maxSelection,
        disable_search_threshold: searchThreshold,
        search_contains: true,
        create_option: addDataOption,
        allow_single_deselect: allowSingleDeselect
      });

      iElm.on('change', function () {
        iElm.trigger('chosen:updated');
      });

      $scope.$watchGroup(watchCollection, function () {
        $timeout(function () {
          iElm.trigger('chosen:updated');
        }, 100);
      });

      // assign event handlers
      EVENTS.forEach(function (event) {
        var eventNameAlias = Object.keys(event)[0];

        if (typeof $scope[eventNameAlias] === 'function') { // check if the handler is a function
          iElm.on(event[eventNameAlias], function (event) {
            $scope.$apply(function () {
              $scope[eventNameAlias](event);
            });
          }); // listen to the event triggered by chosen
        }
      });
    };

    // return the directive
    return {
      name: 'chosen',
      scope: scope,
      restrict: 'A',
      link: linker
    };
  }
  AngularChosen.directive('chosen', ['$timeout', chosen]);
}(angular));