# object-summary-viewer

Clone the project, then within the object-summary-viewer directory, run "wdk-cli run" to run the project in your SevOne widget dev kit environment.

When you are ready to publish your widget, first pack it:

    wdk-cli pack <widget name>

Then publish it to your DI system (update your file name, registry info, and tenant as require for your system:

    wdk-cli publish --skip-ssl --file <widget name>.tgz --registry https://10.128.9.172/wdkserver --tenant SevOne