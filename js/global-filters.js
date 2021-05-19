(function globalFilter() {

    var currentWidgetGuids = [];
    var widgetLoadedCount = 0;

    (function checkListChanged() {

        var allWidgets = visApi().getWidgets();
        var allWidgetsGuids = allWidgets.map(function (w) {
            return w.guid();
        });

        // переключили лист
        if (!deepEqual(allWidgetsGuids, currentWidgetGuids)) {
            widgetLoadedCount = 0;
            currentWidgetGuids = allWidgetsGuids;

            allWidgets.forEach(function (widget) {
                setSelectedValuesIfNeed(widget);
            });

        } else {
            if (allWidgets.length === widgetLoadedCount) {
                saveWidgetsToStorage();
            }
        }

        callAfterDelay(checkListChanged);
    })();


    function getKeyForStorage(widget) {
        var text = widget.widgetState.title.text;
        var dataSettings = widget.widgetState.dataSettings;

        if ((dataSettings.datasourceType !== "olap" && dataSettings.datasourceType !== 6)
            || widget.type() !== "Filter"
            || !text)
            return null;

        var lastChar = text[text.length - 1];
        if (lastChar !== " ")
            return null;

        return text; // ключем является текст заголовка виджета с пробелом в конце
    }

    function saveSelectedValuesToLocalStorage(widget) {
        var key = getKeyForStorage(widget);
        if (key == null)
            return;

        var obj = {
            selectedValues: widget.selectedValues()
        };

        localStorage.setItem(key, JSON.stringify(obj));
    }

    function getSelectedValuesFromLocalStorage(widget) {
        var key = getKeyForStorage(widget);
        if (key == null)
            return null;

        var value = localStorage.getItem(key);
        if (!value)
            return null;

        return JSON.parse(value).selectedValues;
    }

    function deepEqual(obj1, obj2) {
        return JSON.stringify(obj1) === JSON.stringify(obj2);
    }

    function setSelectedValuesIfNeed(widget) {
        if (currentWidgetGuids.indexOf(widget.guid()) === -1)
            return;
            
        if (widget.widgetState == null || widget.widgetDataContainer == null) {
            callAfterDelay(setSelectedValuesIfNeed, widget);
            return;
        }

        var selectedValuesLocalStorage = getSelectedValuesFromLocalStorage(widget);
        var selectedValues = widget.selectedValues();
        if (selectedValuesLocalStorage != null && !deepEqual(selectedValuesLocalStorage, selectedValues)) {
            setFilter(widget.guid(), selectedValuesLocalStorage);
        }

        widgetLoadedCount += 1;
    }

    function setFilter(widgetGuid, values) {
        visApi().setFilterSelectedValues(widgetGuid, values);
    }

    // сохранение выбранных значений фильтров
    function saveWidgetsToStorage() {
        var allWidgets = visApi().getWidgets();
        allWidgets.forEach(function (widget) {
            if (widget.widgetState == null || widget.widgetDataContainer == null)
                return;

            saveSelectedValuesToLocalStorage(widget);
        });
    };

    function callAfterDelay(func, argument) {
        setTimeout(function () {
            func(argument);
        }, 300);
    }
})();