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
      var persistent_create = false;

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
            closeOnConfirm: true,
            closeOnCancel: true,
            'callback': function(isConfirm){
              if(isConfirm) {
                var dd_model = chosen.form_field_jq.data('add-option');
                var data_url = chosen.form_field_jq.data('add-url');
                var url = api_prefix + 'dd';
                if(data_url != null){
                  url = data_url;
                }

                var context_id = window.context_id || '';
                // check to see if there's a releates to data object
                var relatesToSelector = chosen.form_field_jq.data('relates-to');
                if(relatesToSelector != null){ // post with relatedid

                  $.post(url, {name: term, relatedId: $(relatesToSelector).val(), _token: $('meta[name="_token"]').attr('content'), model: dd_model, context_id: context_id}, function(data){
                    chosen.append_option({
                      value: data.id,
                      text: data.name
                    });
                    /*ppnotify('alert', {
                     title: 'Added',
                     message: '"' + data.name + '" option added',
                     type: 'success'
                     });*/
                  });

                }else{ // otherwise post as normal
                  $.post(url, {name: term, _token: $('meta[name="_token"]').attr('content'), model: dd_model, context_id: context_id}, function(data){
                    chosen.append_option({
                      value: data.id,
                      text: data.name
                    });
                    /*ppnotify('alert', {
                     title: 'Added',
                     message: '"' + data.name + '" option added',
                     type: 'success'
                     });*/
                  });
                }
              }
            }
          };

          ppnotify('confirm', confirmOptions);
        }
        persistent_create = true;
      }

      iElm.chosen({
        width: '100%',
        max_selected_options: maxSelection,
        disable_search_threshold: searchThreshold,
        search_contains: true,
        create_option: addDataOption,
        persistent_create_option: persistent_create,
        allow_single_deselect: allowSingleDeselect,
        scroll_to_highlighted: false
      });

      iElm.on('change', function () {
        iElm.trigger('chosen:updated');
      });

      $scope.reOrdered = false;
      $scope.$watchGroup(watchCollection, function () {
        $timeout(function () {

          var noSort = false;
          if(typeof iElm.attr('no-sort') !== 'undefined' && iElm.attr('no-sort') === 'true') {
            noSort = true;
          }

          // force options to be sorted alphabetically
          if($scope.reOrdered === false && noSort === false) {
            var currentVal = iElm.val();
            var my_options = iElm.children();
            my_options.sort(function(a,b) {
              if (a.text > b.text) return 1;
              else if (a.text < b.text) return -1;
              else return 0
            })
            iElm.empty().append(my_options);
            $scope.reOrdered = true;
            iElm.val(currentVal);
            iElm.trigger('chosen:updated');
          }else {
            iElm.trigger('chosen:updated');
          }
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
