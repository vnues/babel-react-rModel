const modelAtrrName = "r-model";
module.exports = function ({ types: t }) {
    function JSXAttributeVisitor(path) {

        if (path.node.name.name === modelAtrrName) {
            let modelStr = objExpression2Str(path.node.value.expression).split(".");
            console.log(modelStr);
            // 如果双向数据绑定的值不是 this.state 的属性，则不作处理
            // 这里存在一种情况就是不是this.state.name  因为有时候我们会这样简写 const {name} = this.state
            // if (modelStr[0] !== "this" || modelStr[1] !== "state") return;
            // 将 modelStr 从类似 ‘this.state.name.value’ 变为 ‘name.value’ 的形式
            // 如果是这种形式this.state.name ===>要改为name
            // if (modelStr.length >= 3 && modelStr[0] === "this" && modelStr[1] === "state") {
            //   modelStr = modelStr.slice(2, modelStr.length).join(".");
            // } else {
            //   modelStr = modelStr.join('.')
            //   console.log(modelStr)
            // }
            // 有很多种情况
            // this.state.name  this.state.name.age  所以我们不做截取
            // 但是会带来一个问题{this.state.name:"vnues"} 没有这种写法 属性名不能是个字符串
            // 可以转化成这种 { [`${types.changePushAssistant}`]:"vnues"}
            if (modelStr[0] === "this" && modelStr[1] === "state") {
                modelStr = modelStr.join(".");
            } else {
                // 我们给它拼接上`this.state`
                // 可能存在this.name这种字段
                modelStr[0] === "this" &&
                    (modelStr = `this.state.${modelStr
                        .slice(1, modelStr.length)
                        .join(".")}`);
                modelStr = `this.state.${modelStr.join(".")}`;
            }
            // 将 model 属性名改为 value
            // 赋予value属性
            path.node.name.name = "value"; // 确实很重要这一步  >>>>>>>>>>>> r-model={this.state.name} --->转化成 value={this.state.name} 单单改变r-model就行
            // r-model={值} 值原来是怎么样 还是原来那样 我们不做操作的 这一步
            const setStateCall = t.callExpression(
                // 调用的方法为 ‘this.setState’
                t.memberExpression(t.thisExpression(), t.identifier("setState")),
                // 调用时传入的参数为一个对象
                // key 为刚刚拿到的 modelStr，value 为 e.target.value
                [t.objectExpression([objPropStr2AST(modelStr, "e.target.value", t)])]
            );

            const onChange = path.parent.attributes.filter(attr => (attr && attr.name && attr.name.name) === 'onChange')[0];
            if (onChange) {
                const callee = onChange.value.expression;
                onChange.value = t.JSXExpressionContainer(
                    t.arrowFunctionExpression(
                        [t.identifier('e')],
                        t.blockStatement([
                            t.expressionStatement(setStateCall),
                            t.expressionStatement(
                                t.callExpression(
                                    callee,
                                    [t.identifier('e')]
                                )
                            )
                        ])
                    )
                )
            } else {
                path.insertAfter(t.JSXAttribute(
                    t.jSXIdentifier('onChange'),
                    t.JSXExpressionContainer(
                        t.arrowFunctionExpression(
                            [t.identifier('e')],
                            t.blockStatement([
                                t.expressionStatement(setStateCall)
                            ])
                        )
                    )
                ));
            }
        }
    }

    function JSXElementVisitor(path) {
        // We can use it alongside the babel parser to traverse and update nodes:
        // 这个方法是更新遍历子节点
        // 这个是对属性节点做操作
        console.log(path.traverse)
        console.log(path.get)
        // console.log(path.xxcc) // undefined
        path.traverse({
            JSXAttribute: JSXAttributeVisitor
        });
    }

    return {
        visitor: {
            JSXElement: JSXElementVisitor
        }
    };
};

// 把 expression AST 转换为类似 “this.state.name” 这样的字符串
function objExpression2Str(expression) {
    // 递归写法
    let objStr;
    if (expression.name) {
        objStr = expression.name;
        return objStr;
    } else {
        switch (expression.object.type) {
            case "MemberExpression":
                objStr = objExpression2Str(expression.object);
                break;
            case "Identifier":
                objStr = expression.object.name;
                break;
            case "ThisExpression":
                objStr = "this";
                break;
        }
        return objStr + "." + expression.property.name;
    }
}
// 把 key - value 字符串转换为 { key: value } 这样的对象 AST 节点
// 2是转换的意思 这里的表达
function objPropStr2AST(key, value, t) {
    console.log(value) // e.target.value
    console.log(objValueStr2AST(value, t))
    return t.objectProperty(t.templateLiteral([t.templateElement({ raw: '', cooked: '' }, true), t.templateElement({ raw: '', cooked: '' }, true)], [t.identifier(key)]), objValueStr2AST(value, t), true)
}

// 对类似e.target.value或者this.state.name.son.xxx转化为AST节点 -无限制
function objValueStr2AST(objValueStr, t) {
    const values = objValueStr.split(".");
    if (values.length === 1) return t.identifier(values[0]);
    // 递归写法
    return t.memberExpression(
        objValueStr2AST(values.slice(0, values.length - 1).join("."), t),
        objValueStr2AST(values[values.length - 1], t)
    );
}
