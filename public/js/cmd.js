		var auth = false;	
		var start_flag = false;
		jQuery(function($, undefined) {
            var main = $('body').terminal({

				start: function() {
					if (start_flag) 
						this.reset();

					start_flag = true;

					this.push(function(name) {
						if (name) {
							this.echo(`Welcome ${name}!`);

							this.push(function(state) {
								if (state) {
									if (state == 'y') {
										this.echo('Please input your seed phrase for identification.');

										this.set_mask('*').read('Seed: ').then(
											keys => this.echo("Your keys are " + keys)
										);
									}
									else {
										var password;
										var flag = false;

										this.set_mask('*').push(function(string) {
											password = string;
												
											if (password) {

												// connect to chain cand create keypair
												this.echo('Creating a new Samaritan for you...');
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
														await res.text().then(seed => {
															main.resume();
															main.echo('You have 30 seconds to copy your keys.');
															main.echo(`Your keys are: [[bg;green;]${seed}]`);
															
															main.pause();
															setTimeout(() => {
																main.update(-1, "Your keys are: [[b;green;]**************************************************************************************]").resume();
																flag = true;
																main.pop();
															}, 30000);
														});
													})();  
												});
											}

										}, {
											prompt: 'Please enter a password: '
										});
									}
								}
							}, {
								prompt: 'Do you have a Samaritan already (y/n): '
							});
						}
					}, {
						prompt: 'What is your pseudo-name: '
					});
				},

				add: function() {
					if (!start_flag) 
						this.exec('start', true);

				},

				init: function() {
					if (!start_flag) this.exec('start', true);

					this.echo("Youre very welcome!");
					this.echo("What would you love to do");
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