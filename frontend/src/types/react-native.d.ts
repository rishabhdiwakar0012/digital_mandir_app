// Fix for React 19 + React Native JSX type compatibility
// This patches the JSX namespace to work with React Native components

import 'react';

declare module 'react' {
    namespace JSX {
        interface Element extends React.ReactElement<any, any> { }
        interface ElementClass extends React.Component<any> {
            render(): React.ReactNode;
        }
        interface ElementAttributesProperty {
            props: {};
        }
        interface ElementChildrenAttribute {
            children: {};
        }
        interface IntrinsicAttributes extends React.Attributes { }
        interface IntrinsicClassAttributes<T> extends React.ClassAttributes<T> { }
    }
}
