(function (document, $) {
    // show/hide our target depending on toggle state
    function showHide(el, initialLoad) {
        var target = el.data('cq-dialog-showhide-target'),
            value = el.val();
        if (!value && $(el).is('coral-select')) {
            value = $(el).find('coral-select-item[selected]').val();
        }
        if ($(el).is('coral-checkbox')) {
            value = el.prop('checked') ? el.val() : '';
        }

        // hide all targets by default
        $(target)
            .not('.hide')
            .addClass('hide');

        if (!initialLoad) {
            if ($(target).filter('[data-cq-dialog-showhide-target-value*="' + value + '"]').length === 0) {
                if ($(target).hasClass('coral-Checkbox')) {
                    $(target).attr('checked', false);
                } else {
                    $(target).val('');
                }
                $(target).trigger('change');
            }
        }

        // show any targets with a matching target value
        $(target)
            .filter('[data-cq-dialog-showhide-target-value*="' + value + '"]')
            .removeClass('hide');
    }

    // listen for dialog injection
    $(document)
        .on('dialog-ready', function () {
            $('.cq-dialog-showhide')
                .each(function () {
                    showHide($(this), true);
                });
        });

    // listen for toggle change
    $(document)
        .on('change', '.cq-dialog-showhide', function (e) {
            showHide($(this), false);
        });
}(document, Granite.$));
