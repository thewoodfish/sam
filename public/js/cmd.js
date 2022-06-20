var auth = false;
		var start_flag = false;
		jQuery(function($, undefined) {
            $('body').terminal({

				start: function() {
					if (start_flag) 
						this.reset();

					start_flag = true;

					this.push(function(state) {
						if (state) {
							if (state == 'y') {
								this.echo('Please input your seed phrase for identification.');

								this.set_mask('*').read('Seed: ').then(
									keys => this.echo("Your keys are " + keys)
								);
							}
							else {
								// connect to chain cand create keypair
								this.echo('Creating a new Samaritan on chain for you...');
								this.echo('You have 30 seconds to copy your keys.');

								this.pause();
								
								this.echo('Your keys are: [[bg;green;]django police zebra coffee arm polite flight lobby destroy candle monopoly pattern]');
								this.pause();
									setTimeout(() => {
										this.update(-1, "Your keys are: [[b;green;]**************************************************************************************]").resume().pop();
									}, 30000);
							}
						}
					}, {
						prompt: 'Do you have a Samaritan already?: '
					});
				},

				add: function() {
					if (!start_flag) 
						this.exec('start', true);

				},

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