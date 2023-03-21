import { outdent } from 'outdent'
import { match } from 'ts-pattern'
import type { Context } from '../../engines'

export function generateSolidJsxPattern(ctx: Context) {
  const { typeName, factoryName } = ctx.jsx

  return ctx.patterns.details.map((pattern) => {
    const { upperName, styleFnName, dashName, jsxName, props, blocklistType } = pattern
    const { description, jsxElement = 'div' } = pattern.config

    return {
      name: dashName,
      js: outdent`
    import { splitProps, mergeProps } from 'solid-js'
    import { createComponent } from 'solid-js/web'
    ${ctx.file.import(factoryName, './factory')}
    ${ctx.file.import(styleFnName, `../patterns/${dashName}`)}

    export function ${jsxName}(props) {
      ${match(props.length)
        .with(
          0,
          () => outdent`
          return createComponent(${factoryName}.${jsxElement}, props)
        `,
        )
        .otherwise(
          () => outdent`
          const [patternProps, restProps] = splitProps(props, [${props.map((v) => JSON.stringify(v)).join(', ')}]);
          const styleProps = ${styleFnName}(patternProps)
          return createComponent(${factoryName}.${jsxElement}, mergeProps(styleProps, restProps))
        `,
        )}
    }
    `,

      dts: outdent`
    import { Component } from 'solid-js'
    import { ${upperName}Properties } from '../patterns/${dashName}'
    import { ${typeName} } from '../types/jsx'

    export type ${upperName}Props = ${upperName}Properties & Omit<${typeName}<'${jsxElement}'>, keyof ${upperName}Properties ${blocklistType}>

    ${description ? `/** ${description} */` : ''}
    export declare const ${jsxName}: Component<${upperName}Props>
    `,
    }
  })
}
