
		// initialize storage
		var samaritan = {
			pseudo: "",
			cid: "",
			data: {},
			apps: []
		};

		localStorage.setItem('samaritan', JSON.stringify(samaritan));

		var get_sdata = () => {
			// get samaritan deep data
			var sam = JSON.parse(localStorage["samaritan"]);

			// first check if data is string or parsed
			if (typeof sam.data == "string") 
				return JSON.parse(sam.data);
			else	
				return sam.data;
		}

		var get_sdesc = () => {
			// get samaritan cid & pseudo
			var sam = JSON.parse(localStorage["samaritan"]);

			return { pseudo: sam.pseudo, cid: sam.cid };
		}

		var auth = false;	
		var start_flag = false;
		var pseudo_name = get_sdesc().pseudo;

		var check_for_reset = (main, str) => {
			var flag = false;
			if (str == 'reset') {
				main.reset();
				flag = true;
			}

			return flag;
		}

		var ensure_state = (main) => {
			let exist = true;

			if (!get_sdesc().cid) {
				main.error("No Samaritan state loaded!");
				exist = false;
			}

			return exist;
		}

		jQuery(function($, undefined) {
            var main = $('body').terminal({

				start: function() {
					if (start_flag && pseudo_name) {
						this.error(`Samaritan state with pseudo-name "${pseudo_name}" already loaded`);
						return;
					}

					start_flag = true;

					this.push(function(name) {
						if (name) {
							if (!check_for_reset(main, name))
								this.echo(`Welcome ${name}!`);

							this.push(function(state) {
								if (state) {
									check_for_reset(main, state);

									if (state == 'y') {
										this.echo('Please input your seed phrase.');

										this.set_mask('*').read('Seed: ').then(keys => {
											check_for_reset(main, keys);

											this.set_mask('*').read('Enter your password: ').then(password => {
												check_for_reset(main, password);

												// send keys to server to chain for authentication (very insecure!)
												this.echo("Connecting to chain to authenticate you...");
												this.pause();
												
												fetch ("/auth_account", {
													method: 'post',
													headers: {
														'Content-Type': 'application/json'
													},
													body: JSON.stringify({
														'keys': keys,
														'password': password,
														'pseudo': name
													})
												})
												.then(res => {
													(async function () {
														await res.json().then(res => {
															let bool = res.var.bool;

															// save locally
															var samaritan = {
																pseudo: pseudo_name,
																cid: res.var.cid,
																data: res.data
															};

															localStorage.setItem('samaritan', JSON.stringify(samaritan));

															main.resume();

															if (bool == "true") {
																pseudo_name = name;
																localStorage["samaritan"].pseudo = name;

																main.echo("Authentication successful!");
																main.echo(`Samaritan ${pseudo_name} successfully imported`);
															} else 
																main.error("Could not find Samaritan with details provided!");

															main.set_mask(false);
														});
													})();  
												});
											});
										});
									}
									else if (state == 'n') {
										var password;

										this.set_mask('*').push(function(string) {
											password = string;
												
											if (password) {
												check_for_reset(main, password);

												// connect to chain cand create keypair
												this.echo('Creating your Samaritan...');
												this.pause();
												fetch ("/create_account", {
													method: 'post',
													headers: {
														'Content-Type': 'application/json'
													},
													body: JSON.stringify({
														'name': name,
														'password': password
													})
												})
												.then(res => {
													(async function () {
														await res.json().then(res => {
															var seed = res.seed;
															
															// save locally
															var samaritan = {
																pseudo: pseudo_name,
																cid: res.var.cid,
																data: res.data
															};

															localStorage.setItem('samaritan', JSON.stringify(samaritan));

															main.resume();
															main.echo('You have 30 seconds to copy your keys.');
															main.echo(`Your Samaritan keys are: [[bg;green;]${seed}]`);

															pseudo_name = name;
															localStorage["samaritan"].pseudo = name;
															
															main.pause();
															setTimeout(() => {
																main.update(-1, "Your Samaritan keys are: [[b;green;]**************************************************************************************]").resume();
																main.echo(`Samaritan ${pseudo_name} successfully imported`);
																main.pop();
															}, 3000);
														});
													})();  
												});
											}
										}, {
											prompt: 'Please enter your new password: ',
											onPop: function(before, after) {
												passwd.pop();
											},
											name: "passwd", 
										});
									}
								}
							}, {
								prompt: 'Do you have a Samaritan already (y/n): ',
								onPop: function(before, after) {
									this.pop();
								},
							});
						}
					}, {
						prompt: 'What is your pseudo-name: ',
						onPop: function(before, after) {
							this.pop();
							this.set_prompt(`[[b;green;]{${pseudo_name ? pseudo_name : ""}}>>>]`);
						},
					});
				},

				help: function() {
					this.echo("[[b;green;]Samaritan 0.1.0. A digital Identity Solution (c) 2022]");	
					this.echo("The following commands are currently supported by Samaritan: ");
					this.echo("[[b;green;]start:] First command to run to load Samaritan state into the terminal. You can also create a new Samaritan if you don't have one already. After importing state, you can't call start again until reload of terminal & server.");
					this.echo("[[b;green;]reset:] Reset terminal");
					this.echo("[[b;green;]help:] Show commands currently supported by Samaritan and their brief description.");
					this.echo("[[b;green;]info {param}:] Get information about Samaritan. {param} can be one of many commands:\
						\n 1. [[b;green;]`personal`:] Load users personal details.");
					this.echo("[[b;green;]mod {attribute} {value}:] Change the personal properties of a Samaritan. e.g mod age 27");
					this.echo("[[b;green;]create:] Sign an app and add it into the Samaritan Ability Pool");
					this.echo("[[b;green;]app_status: { App CID }] Check app verification status onchain with the Apps CID.");

				},

				reset: function() {
					this.reset();
				},

				create: function() {
					// make sure a Samaritan is loaded already
					if (ensure_state(this))
						document.querySelector(".upload").style.display = "block";
				},

				info: function(command) {
					// make sure a Samaritan is loaded already
					if (ensure_state(this)) {
						let sam = get_sdata();

						// get personal info
						switch (command) {
							case "personal": {
								this.echo(`Pseudo-name: ${pseudo_name}`);
								this.echo(`IPFS CID: ${get_sdesc().cid}`);
								this.echo(`Substrate Address(Public): ${sam.addr}`);
								this.echo(`Name: ${sam.name}`);
								this.echo(`Age: ${sam.age}`);
								this.echo(`Sex: ${sam.sex}`);
								this.echo(`D-o-B: ${sam.d_o_b}`);
								this.echo(`Religion: ${sam.religion}`);
								this.echo(`Telephone: ${sam.telephone}`);
								this.echo(`Email: ${sam.email}`);
							}
						}
					}
				},

				app_status: function(cid) {
					// check verificatio status of uploaded app onchain
					this.echo("Checking app verification status...");
					this.pause();

					// send to server modify and commit to IPFS
					fetch ("/check_vstatus", {
						method: 'post',
						headers: {
							'Content-Type': 'application/json'
						},
						body: JSON.stringify({
							"app_cid": cid
						})
					})
					.then(res => {
						(async function () {
							await res.json().then(res => {
								var msg = "";

								main.resume();
								switch (res.status) {
									case "ongoing verification": 
										msg = `[[b;green;]App with CID: "${res.cid}" is still under verification by the network]`;
										break;
									case "verification passed":
										msg = `[[b;green;]App with CID: "${res.cid}" has been verified by the network. You can download it now!]`;
										break;
									default:
										msg = `[[b;green;]App with CID: "${res.cid}" is not recognised by the network]`;
										break;
								}

								main.echo(msg);
							});
						})();  
					});
				},

				download: function(app_cid) {
					// make sure a Samaritan is loaded already
					// if (ensure_state(this)) {
						// download app from IPFS and record onchain
						this.echo(`Fetching app with CID ${app_cid}...`);
						this.pause();

						fetch ("/download", {
							method: 'post',
							headers: {
								'Content-Type': 'application/json'
							},
							body: JSON.stringify({
								"cid": app_cid,
								"addr": get_sdesc().addr
							})
						})
						.then(res => {
							(async function () {
								await res.json().then(res => {
									main.resume();

									if (res.err) 
										main.error(`App with CID ${app_cid} is not present in the ability pool`);
									else {
										// add app to localStorage
										localStorage["samaritan"].apps.push({ location: res.file.location, name: res.file.name });
										main.echo(`${res.file.name} successfully downloaded!`);
									}
								});
							})();  
						});
					// }
				},

				load: function(cmd) {
					if (cmd == "apps") {
						// query chain for user apps and store them in localStorage
						this.echo("Fetching apps avaliable on network..");
						this.pause();

						fetch ("/load_apps", {
							method: 'get',
							headers: {
								'Content-Type': 'application/json'
							}
						})
						.then(res => {
							(async function () {
								await res.json().then(res => {
									let apps = res.apps;

									main.resume();
									main.echo(`There are ${apps.length} apps currently on the network`);
									// print info about apps avalible
									apps.forEach(app => {
										main.echo(" ");
										main.echo(`Name: ${app.name}`);
										main.echo(`CID: ${app.cid}`);
										main.echo(`Developer: ${app.developer}`);
										main.echo(`Permissions: ${app.permissions}`);
										main.echo(" ");
									});
								});
							})();  
						});
					}
				},

				mod: function(prop, value) {
					if (ensure_state(this)) {
						let properties = ["name", "age", "sex", "d_o_b", "religion", "telephone", "email"];
						let mem = false;

						let cid = get_sdesc().cid; 
						let sam = get_sdata();

						for (var i = 0; i < properties.length; i++) 
							if (prop == properties[i]) {
								mem = true;
								break;
							}

						// check if property specified is correct
						if (!mem) {
							this.error(`Property "${prop}" not found`);
							return;
						}

						this.echo("Updating your state...");
						this.pause();

						// send to server modify and commit to IPFS
						fetch ("/mod_state", {
							method: 'post',
							headers: {
								'Content-Type': 'application/json'
							},
							body: JSON.stringify({
								"cid": cid,
								"addr": sam.addr,
								"name": pseudo_name,
								'prop': prop,
								'val': value
							})
						})
						.then(res => {
							(async function () {
								await res.json().then(res => {
									
									// save details locally
									var samaritan = {
										pseudo: pseudo_name,
										cid: res.var.cid,
										data: res.data
									};

									localStorage.setItem('samaritan', JSON.stringify(samaritan));

									main.resume();
									main.echo("Your state has been updated!");
								});
							})();  
						});
					}
				}

			}, {
                greetings: function () {
					if (!this.mobileDelete)
						return greetings.innerHTML
					else 
						return 'A Digital Identity Solution. To begin, enter "start"'
				}, 
                name: 'Samaritan',
				historySize: 10,
                prompt: '[[b;green;]>>> ]',
				onInit: function() {
					
				}
            });
        });
