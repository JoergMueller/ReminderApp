

(function (localforage) {
    
    'use strict';
    
    var languages = {
        'default': 'de',
        'list': {
            'de': {'short': 'de', 'locale': 'de_DE', 'name': 'Deutsch', 'timezone': 'Europe/Berlin', 'datefmt': 'dd.MM.yyyy HH:mm'},
            'en': {'short': 'en', 'locale': 'en_US', 'name': 'English', 'timezone': 'UTC', 'datefmt': 'd MMM  yyyy h:mma'}
        }
    }, app;
    
    app = angular.module("ReminderApp", ['LocalForageModule', 'angularMoment', 'gettext', 'ngSanitize']).config(['$localForageProvider', function ($localForageProvider) {
        $localForageProvider.setNotify(true, true);
        $localForageProvider.config({
            driver      : 'localStorageWrapper', // if you want to force a driver
            version     : 1.0, // version of the database, you shouldn't have to use this
            storeName   : 'keyvaluepairs', // name of the table
            description : 'some description',
            name: 'ReminderApp' // name of the database and prefix for your data
        });
    }]).run(['gettextCatalog', 'amMoment', function (gettextCatalog, amMoment) {
        amMoment.changeLocale('de');
        gettextCatalog.setCurrentLanguage('de');
        gettextCatalog.debug = true;
    }]);
    
    app.controller("MainController", ['$scope', 'gettextCatalog', '$localForage', 'amMoment', function ($scope, gettextCatalog, $localForage, amMoment) {
        var self = this, lang, currentLangIndex, inc, i;


        $scope.modal = {
        };
        
        this.debug = false;
        this.languages = languages;
        lang = JSON.parse(localStorage.getItem('ReminderApp/lang')) || null;
        if (lang === null) {
            lang = this.languages.default;
            $localForage.setItem('lang', lang);
        }
        gettextCatalog.setCurrentLanguage(lang);
        gettextCatalog.loadRemote("/js/language/" + lang + ".json");
        
        $scope.$watch('correctlyLanguageSelected', function (arg) {
            $scope.switchLanguage(arg);
        });
        $scope.switchLanguage = function (arg) {
            if (arg === undefined) { return; }
            if (self.languages.list[arg.value] === undefined) {
                lang = self.languages.default;
            } else {
                lang = arg.value;
            }
            gettextCatalog.setCurrentLanguage(lang);
            gettextCatalog.loadRemote("/js/language/" + lang + ".json");
            $localForage.setItem('lang', lang);
            amMoment.changeLocale(lang);
        };
        this.options = [];
        currentLangIndex = null;
        inc = 0;
        for (i in this.languages.list) {
            currentLangIndex = this.languages.list[i].short === lang ? inc : currentLangIndex;
            this.options.push({
                label: this.languages.list[i].name,
                value: this.languages.list[i].short
            });
            inc += 1;
        }

        $scope.correctlyLanguageSelected = this.options[currentLangIndex];
        amMoment.changeLocale(lang);
        $scope.localeSet = this.languages.list[lang];
        
        this.langIsSet = function (selectedLang) {
            return (gettextCatalog.getCurrentLanguage() === selectedLang);
        };
    }]);

    app.controller("UserController", ['uuid', '$localForage', '$scope', '_georev', '$filter', function (uuid, $localForage, $scope, _georev, $filter) {
        var self = this;
        
//        $scope.$parent.modal.trg = 'MODAL_TRIGGER';
        
        this.getUserData = function () {
            $localForage.getItem('User').then(function (data) {
                self.User = data || {};
            });
        };
        
        this.setUserData = function () {
            this.User.id = this.User.id === undefined ? uuid.generate() : this.User.id;
            this.User.createdOn = this.User.createdOn === undefined ? new Date() : this.User.createdOn;
            $localForage.setItem('User', this.User);
        };
        
        this.User = this.User || this.getUserData();
    }]);
    
    app.service('_georev', [ '$http', function ($http) {
        return {
            byaddress: function (str, model) {
                return $http.get('https://maps.googleapis.com/maps/api/geocode/json?address=' + str)
                    .success(function (data) {
                        model.coords = data.status === 'OK' ? data.results[0].geometry.location : null;
                    });
            }
        };
    }]);
    app.controller("RemTabbing", [ 'uuid', '$localForage', '$scope', '_georev', '$filter', function (uuid, $localForage, $scope, _georev, $filter) {
        var self = this;

        this.debug = false;
        this.tab = '#settings';
        this.today = new Date();
        this.newEntry = {expire: new Date(this.today.getFullYear(), this.today.getMonth(), this.today.getDay() + 1, this.today.getHours(), this.today.getMinutes(), 0) };
        $scope.entries = [];
        this.todo = {};
        

        $localForage.getItem('tabs').then(function (data) {
            
            self.tabs = data || [];
            self.tab = data !== undefined && data[0] !== undefined ? data[0].id : '#setting';
            data.forEach(function (o, i) {
                $scope.entries[o.id] = JSON.parse(localStorage.getItem('ReminderApp/' + o.id));
            });
        });

        this.selectTab = function (newTab) {
            this.tab = newTab;
        };
        
        this.removeTab = function (item) {
            var newArray = [], i;
            if (this.tabs.length) {
                for (i in this.tabs) {
                    if (this.tabs[i].id !== item.id) { newArray.push(this.tabs[i]); }
                }
                $localForage.setItem('tabs', newArray);
                $localForage.removeItem(item.id);
                location.reload();
            }
        };
        
        this.isSelected = function (value) {
            return this.tab === value;
        };

        this.setTodos = function (item) {
            var self = this, i;

            self.newEntry.expire = new Date($filter('date')(self.newEntry.expire, 'yyyy/MM/dd HH:mm:ss Z'));
            self.newEntry.createdOn = self.newEntry.createdOn !== undefined ? self.newEntry.createdOn : new Date();
            self.newEntry.doneOn = self.newEntry.doneOn !== undefined && self.newEntry.doneOn !== false ? self.newEntry.doneOn : false;
            
            $scope.entries[item.id] = $scope.entries[item.id] === undefined || $scope.entries[item.id] === null ? [] : $scope.entries[item.id];

            // check for georeverse
            if (self.newEntry.georeverse !== undefined) {
                _georev.byaddress(self.newEntry.georeverse, self.newEntry);
            }

            if (self.newEntry.id !== undefined) {
                for (i in $scope.entries[item.id]) {
                    if ($scope.entries[item.id][i].id === self.newEntry.id) {
                        $scope.entries[item.id][i] = self.newEntry;
                    }
                }
            }
            else {
                self.newEntry.id = uuid.generate();
                $scope.entries[item.id].push(self.newEntry);
            }
            
            $
            $localForage.setItem(item.id, $scope.entries[item.id]).then(function () {
                var _date = new Date();
                self.newEntry = {expire: new Date($filter('date')(new Date(), 'yyyy/MM/dd HH:mm:00 Z')) };
            });
            
        };
        
        this.getEdit = function (todo) {
            self.newEntry = todo;
            self.newEntry.expire = new Date($filter('date')(self.newEntry.expire, 'yyyy/MM/dd HH:mm:ss Z'));
        };

        this.removeTodo = function (selectedTodo, item) {
            var newArray = [], i;
            if ($scope.entries[item.id].length) {
                for (i in $scope.entries[item.id]) {
                    if ($scope.entries[item.id][i].id !== selectedTodo.id) {
                        newArray.push($scope.entries[item.id][i]);
                    }
                }
            }
            $scope.entries[item.id] = newArray;
            $localForage.setItem(item.id, newArray);
        };
        
        this.setDone = function (entry, item) {
            var i, _date = new Date();
            for (i in $scope.entries[item.id]) {
                if ($scope.entries[item.id][i].id === entry.id) {
                    $scope.entries[item.id][i].doneOn = $scope.entries[item.id][i].doneOn !== false ? false : new Date($filter('date')(new Date(), 'yyyy/MM/dd HH:mm:ss Z'));
                }
            }
            $localForage.setItem(item.id, $scope.entries[item.id]);
        };
        
        this.isDone = function (entry) {
            return entry.doneOn !== false;
        };
        
    }]);
    
    app.directive('newEntryForm', function () {
        return {
            restrict: 'E',
            templateUrl: '/snippets/new-entry-form.html'
        };
    });
    
    app.directive('listForm', function () {
        return {
            restrict: 'E',
            templateUrl: '/snippets/list-form.html'
        };
    });
    
    app.directive('userForm', function () {
        return {
            restrict: 'E',
            templateUrl: '/snippets/user-form.html'
        };
    });
    
    app.directive('metaHead', function () {
        return {
            restrict: 'E',
            templateUrl: '/snippets/meta-head.html'
        };
    });
    
    app.directive('listItem', function () {
        return {
            restrict: 'E',
            templateUrl: '/snippets/list-item.html'
        };
    });
    
    app.directive('ngReallyClick', [function() {
        return {
            restrict: 'A',
            link: function(scope, element, attrs) {
                element.bind('click', function() {
                    var message = attrs.ngReallyMessage;
                    if (message && confirm(message)) {
                        scope.$apply(attrs.ngReallyClick);
                    }
                });
            }
        }
    }]);
    
    app.filter('bbcode', function() {
        var span = document.createElement('span');
        return function(input) {
            return (input || '').replace(/\n/g, '<br>')
                    .replace(/(\[([\/a-z0-9 ]+)\])/g, '<$2>');
        }
    });
    
    app.filter('sprintf', function() {
        return function(input, args) {
            while(/%s/.test(input)) {
                input = input.replace(/%s/, args.shift());
            }
            return input;
        }
    });
    
    app.controller("RemTabbingForm", [ '$scope', 'uuid', '$localForage', function ($scope, uuid, $localForage) {
        var self = this;
        
        this.jtabs = [];
        $scope.newList = {'id': uuid.generate()};

        this.setNewList = function (newListEntry) {

            $localForage.getItem('tabs').then(function (data) {
                self.jtabs = data || [];
                $scope.newList.name = newListEntry.name;
                self.jtabs.push($scope.newList);
                $localForage.setItem('tabs', self.jtabs);
                $scope.newList = {'id': uuid.generate()};
                
                location.reload();
            });

        };

    }]);

    app.factory('uuid', function () {
        var svc = {
            generate: function () {
                var d = new Date().getTime(), uuid;
                uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                    var r = (d + Math.random() * 16) % 16 | 0;
                    d = Math.floor(d / 16);
                    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
                });
                return uuid;
            },
        
            empty: function () {
                return '00000000-0000-0000-0000-000000000000';
            }
        };
        return svc;
    });
    
    app.directive('richTextEditor', function() {
        return {
            restrict: 'A',
            replace: true,
            require: '?ngModel',
            transclude: true,
            template: '<div><textarea class="form-control h300" ng-model="tab.newEntry.description"></textarea></div>',
            link : function($scope, element, attrs, ctrl) {
                var textarea = $(element.find('textarea')).wysihtml5({
                    'image': false,
                    'html': true
                });
                var editor = textarea.data('wysihtml5').editor;
                editor.on('change', function() {
                    $scope.$apply(function() {
                        ctrl.$setViewValue(editor.getValue());
                    });
                });
                ctrl.$render = function() {
                    textarea.html(ctrl.$viewValue);
                    editor.setValue(ctrl.$viewValue);
                }
                ctrl.$render();
            }
        };
    });


})(localforage);
