		var auth = false;	
		var start_flag = false;
		var pseudo_name = "";
		var sam = {
			cid: "",
			data: {}
		};

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

			if (!sam.cid) {
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
													(async function handle() {
														await res.json().then(res => {
															let bool = res.var.bool;

															sam.data = JSON.parse(res.data);
															sam.cid = res.var.cid;
															
															main.resume();

															if (bool == "true") {
																pseudo_name = name;
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
													(async function handle() {
														await res.json().then(res => {
															var seed = res.seed;
															
															// save details locally
															sam.data = JSON.parse(res.data);
															sam.cid = res.var.cid;

															main.resume();
															main.echo('You have 30 seconds to copy your keys.');
															main.echo(`Your Samaritan keys are: [[bg;green;]${seed}]`);

															pseudo_name = name;
															
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
					

				},

				reset: function() {
					this.reset();
				},

				info: function(command) {
					// make sure a Samaritan is loaded already
					if (ensure_state(this)) {
						
						// get personal info
						switch (command) {
							case "personal": {
								this.echo(`Pseudo-name: ${pseudo_name}`);
								this.echo(`IPFS CID: ${sam.cid}`);
								this.echo(`Substrate Address(Public): ${sam.data.addr}`);
								this.echo(`Name: ${sam.data.name}`);
								this.echo(`Age: ${sam.data.age}`);
								this.echo(`Sex: ${sam.data.sex}`);
								this.echo(`D-o-B: ${sam.data.d_o_b}`);
								this.echo(`Religion: ${sam.data.religion}`);
								this.echo(`Telephone: ${sam.data.telephone.map( (e) => (e) ).join(' ')}`);
								this.echo(`Email: ${sam.data.email.map( (e) => (e) ).join(' ')}`);
							}
						}
					}
				},

				mod: function(prop, value) {
					if (ensure_state(this)) {
						let properties = ["name", "age", "sex", "d_o_b", "religion", "telephone", "email"];
						let mem = false;

						for (var i = 0; i < properties.length; i++) 
							if (prop == properties[i]) {
								mem = true;
								break;
							}

						// check if property specified is correct
						if (!mem)
							this.error(`Property "${prop}" not found`);

						// send to server modify and commit to IPFS
						fetch ("/mod_state", {
							method: 'post',
							headers: {
								'Content-Type': 'application/json'
							},
							body: JSON.stringify({
								"cid": sam.cid,
								"addr": sam.addr,
								"name": pseudo_name,
								'prop': prop,
								'val': value
							})
						})
						.then(res => {
							(async function handle() {
								await res.json().then(res => {

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
                prompt: '[[b;green;]>>> ]'
            });
        });