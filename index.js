const modelAtrrName = "r-model";
module.exports = function ({ types: t }) {
    function JSXAttributeVisitor(path) {

        if (path.node.name.name === modelAtrrName) {
            let modelStr = objExpression2Str(path.node.value.expression).split(".");
            if (modelStr[0] === "this" && modelStr[1] === "state") {
                modelStr = modelStr.join(".");
            } else {

                modelStr[0] === "this" &&
                    (modelStr = `this.state.${modelStr
                        .slice(1, modelStr.length)
                        .join(".")}`);
                modelStr = `this.state.${modelStr.join(".")}`;
            }

            path.node.name.name = "value";
            const setStateCall = t.callExpression(
                t.memberExpression(t.thisExpression(), t.identifier("setState")),
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

function objExpression2Str(expression) {
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
                objStr = "this";
                break;
        }
        return objStr + "." + expression.property.name;
    }
}

function objPropStr2AST(key, value, t) {
    console.log(value)
    console.log(objValueStr2AST(value, t))
    return t.objectProperty(t.templateLiteral([t.templateElement({ raw: '', cooked: '' }, true), t.templateElement({ raw: '', cooked: '' }, true)], [t.identifier(key)]), objValueStr2AST(value, t), true)
}

function objValueStr2AST(objValueStr, t) {
    const values = objValueStr.split(".");
    if (values.length === 1) return t.identifier(values[0]);
    return t.memberExpression(
        objValueStr2AST(values.slice(0, values.length - 1).join("."), t),
        objValueStr2AST(values[values.length - 1], t)
    );
}
