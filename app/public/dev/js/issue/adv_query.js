var IssueAdvQuery = (function () {
    // constructor
    var adv_options = {
        modules: [],
        resolves: [],
        status: [],
        issueTypes: [],
        priority: [],
        sprints: [],
        users: [],
        logics: [
            {
                name: "并且",
                value: "and"
            },
            {
                name: "或者",
                value: "or"
            }
        ],
        opts: [
                { value: "LIKE" },
                { value: "LIKE %...%" },
                { value: "NOT LIKE" },
                { value: "=" },
                { value: "!=" },
                { value: "REGEXP" },
                { value: "REGEXP ^...$" },
                { value: "NOT REGEXP" },
                { value: "= ''" },
                { value: "!= ''" },
                { value: "IN (...)" },
                { value: "NOT IN (...)" },
                { value: "BETWEEN" },
                { value: "NOT BETWEEN" },
                { value: "IS NULL" },
                { value: "IS NOT NULL" }
            ],
        braces: [
            { value: ""},
            { value: "("},
            { value: ")"},
            { value: "{"},
            { value: "}"}
        ],
        fields: []
    };

    function IssueAdvQuery(options) {
        var tempOptions = JSON.parse(JSON.stringify(options));
        console.log(options);
        for (var value of Object.values(advFields)) {
            adv_options.fields.push({
                value: value.title,
                title: value.title,
                source: value.source,
                type: value.type
            });
        }

        for (var [key, value] of Object.entries(tempOptions.issue_module)) {
            adv_options.modules.push({
                name: value.name,
                value: key
            });
        }

        for (var [key, value] of Object.entries(tempOptions.issue_resolve)) {
            adv_options.resolves.push({
                name: value.name,
                value: key
            });
        }

        for (var [key, value] of Object.entries(tempOptions.issue_status)) {
            adv_options.status.push({
                name: value.name,
                value: key
            });
        }

        for (var [key, value] of Object.entries(tempOptions.issue_types)) {
            adv_options.issueTypes.push({
                name: value.name,
                value: key
            });
        }

        for (var [key, value] of Object.entries(tempOptions.priority)) {
            adv_options.priority.push({
                name: value.name,
                value: key
            });
        }

        adv_options.sprint = tempOptions.sprint;

        for (var [key, value] of Object.entries(tempOptions.users)) {
            adv_options.users.push({
                name: value.username,
                value: key,
                avatar: value.avatar
            });
        }

        console.log(adv_options);
    };

    IssueAdvQuery.prototype.renderAdvQuery = function (details) {
        var source = $('#content_table_adv_tpl').html();
        var template = Handlebars.compile(source);
        var result = template({tableList: details});

        $("#adv-tbody").html(result);
    }

    IssueAdvQuery.prototype.renderListAdvQuery = function (details) {

        //console.log(details)
        if(is_empty(details)){
            $('#adv_query_display_container').addClass('hide');
        }else{
            $('#adv_query_display_container').removeClass('hide');
        }
        var source = $('#adv_query_display_tpl').html();
        var template = Handlebars.compile(source);
        var result = template({tableList: details,length:details.length-1});

        $("#adv_query_diplay").html(result);
    }

    IssueAdvQuery.prototype.saveAdvQuery = function (name) {

        if(is_empty(name)){
            notify_warn('提示','过滤器名称不能为空!');
            return;
        }
        var filterJson =  JSON.stringify(adv_details);
        if(is_empty(adv_details)){
            notify_warn('提示','查询条件为空!');
            return;
        }
        var params = { format: 'json' };
        $.ajax({
            type: "POST",
            dataType: "json",
            async: true,
            url: root_url + 'issue/main/save_adv_filter',
            data: { project_id: window._cur_project_id, name: name, filter: filterJson },
            success: function (resp) {
                auth_check(resp);
                if (resp.ret == '200') {
                    notify_success('保存成功');
                    window.qtipApi.hide()
                    $('#btn-save_adv_filter').qtip('api').toggle(false);
                } else {
                    notify_error('保存失败,错误信息:' + resp.msg);
                }

            },
            error: function (res) {
                notify_error("请求数据错误" + res);
            }
        });


    }


    IssueAdvQuery.prototype.renderTableAdvQuery = function (field_name, dataType, data, index, title, source) {
        var html = '';

        switch (dataType) {
            case "text":
                html = IssueAdvQuery.prototype.makeFieldText(data, index, field_name);
                break;
            case "select":
                html = IssueAdvQuery.prototype.makeFieldSelect(data, index, field_name, title, source);
                break;
            case "date":
                html = IssueAdvQuery.prototype.makeFieldDate(data, index, field_name);
                break;
            case "datetime":
                html = IssueAdvQuery.prototype.makeFieldDatetime(data, index, field_name);
                break;
        }

        return html;
    }

    IssueAdvQuery.prototype.makeFieldText = function (data, index, field_name) {
        var html = '';
        var inputName = field_name + '-' + index;
        if (index === "") {
            inputName = field_name;
        }
        html += '<input type="text" class="form-control" name="' + inputName + '" data-index="' + index + '" data-name="' + field_name + '"  value="' + data + '" />';

        return html;
    }

    IssueAdvQuery.prototype.makeFieldSelect = function (data, index, field_name, title, source) {
        var temp = {
            value: data,
            index: index,
            field_name: field_name,
            title: title,
            data: []
        }

        if (source && source !== "status" && source !== "priority") {
            temp.data = adv_options[source + "s"];
        } else if (source === "status" || source === "priority") {
            temp.data = adv_options[source];
        } else {
            temp.data = []
        }

        temp.data.forEach(function (n) {
            if (n.value === temp.value) {
                n.selected = true;
            }
        });

        var source = $('#adv_query_form_tpl').html();
        var template = Handlebars.compile(source);
        var html = template(temp);

        return html;
    }

    IssueAdvQuery.prototype.makeFieldDate = function (data, index, field_name) {
        var html = '';
        var className = "form-control";
        var inputName = field_name + '-' + index;
        if (index === "") {
            inputName = field_name;
        }
        html += '<input type="text" class="laydate_input laydate_input_date ' + className + '" data-index="' + index + '" data-name="' + field_name + '" name="' + inputName + '" placeholder="yyyy-MM-dd" value="' + data + '">';

        return html;
    }

    IssueAdvQuery.prototype.makeFieldDatetime = function (data, index, field_name) {
        var html = '';
        var className = "form-control";
        var inputName = field_name + '-' + index;
        if (index === "") {
            inputName = field_name;
        }
        html += '<input type="text" class="laydate_input laydate_input_datetime ' + className + '" data-index="' + index + '" data-name="' + field_name + '" name="' + inputName + '" placeholder="yyyy-MM-dd HH:mm:ss" value="' + data + '">';

        return html;
    }

    return IssueAdvQuery;
})();
