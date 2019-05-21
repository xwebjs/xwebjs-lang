1. Object initialization should not reside in Object constructor
 * The exception can not be thrown out in the constructor
 * Initialization normally has asynchronous call in it. It is not reasonable to return object instance while the initialization is still in progress
 
2. How to define the custom application
 
	* What information the custom application should contain? 
		* Application name for readability
		* Application identifier for unique key
 		* Dependent modules
 		* Application init method with a series of hook methods
  	
	* How to define these information?
		*  Through the class which implements required interface 
		*  Trough the meta information, the meta contain static information, such as name and identifier, but it can not contain codes logic. 
		
		Overall, we can see, using interface to define methods for getting static information and hook methods definition is the foundation. 
		Based on the interface definition, we can have abstract method for default template implementation, which could only need to pass name and identifier information. 

3. How to start the loading the custom application from system perspective?

	From the system perspective, after the initialization of itself is completed, then, it needs to create the application and call application init method. The questions become how for the system to know what application to be started. from system highest level call sequence, the whole logic should be wrapped in the startMainApp() method, this method has following sub function calls inside it. 
	
	```javascript
	function startMainApp(){
		var defaultApp = this.getDefaultApp()
		this.defaultApp.init().then(
		  // after the default is started successfully
		  function(){
		  },
		  // error
		  function(){
		  }
		  // progress
		  function(){
		  }
		)
	}
	```  
4. system init process

	* Check preconditions
	check whether required libraries are loaded or not. This precondition library loading can be handled by BootHelper which is native object for checking environments, preparing meta, DOM, and JS libraries.
	
	* Create the system instance, this step is called automatically ( like static constructor ) during the system module loading process
	
		`_x.setupSystem()`
	
	* Configure system

		Get the system reference, and set configuration through calling setConfiguration. 
	
		```javascript
		var system = _x.getSystem()
		system.setConfiguration({
			...
    })
		```
	
	* System init process

		1. load system modules and trigger the init process
	
			System modules information are loaded through reading the remote system configuration. Here, why there are two types of libraries ( boot and extended ), the concept comes from the Java. There are few goals behind:
			
			* The modules in the boot libraries are dependencies for all other modules, which are loaded as the first
			* The boot and extended and application level library are in the inheritance hierarchy, and the boot library is the root one
			
			```javascript
			var bModules,eModules
			bModules = this.getSystemConfig(test_2)
			eModules = this.getSystemConfig(test_2)
			```
			
			SystemContext takes the responsibility of loading the remote modules or module bundle into system context. Here, we need to consider: how to use the method from the parent class ModuleContext on loading modules? how to track the loading progress of each bundle / modules? and how to trigger the next step in the chain.
			
			```javascript
			this.systemCtx.load([bModules,eModules]).then(
				this.startDefaultApp,
				handleErrorOutput
			)
			
			```
			In the loadModules method of the system context
			
			```javascript
			function loadModules(modules){
				//load both core and extended modules
			}
			```
	
		2. Get the default application
		
			Default application module name is configured in the remote system configuration
	
			```javascript
			function getDefaultApp(){
				var defaultAppModulePath;
				var defaultAppModule;
				var defaultApp;
				try{
					defaultAppModulePath = this.getSystemConfig(test_2)
					defaultAppModule = this.systemCtx.getModule(defaultAppModulePath)
					defaultApp = defaultAppModule.getClass().newInstance();
					return defaultApp;
				}catch(e){
					throw Error("Fail to load the default app path")
				}
			}
			```
		
		3. Start the default application
		
			From the high level view, the launching step has following steps: application init, mounting the app's main view to the DOM in the document body.
			
			```javascript
			function launchDefaultApp(app){
			 app.init().then(
				this._mountDefaultApp
			 ).then(
				app.onAppMounted
			 )
			}
			```
5.  


