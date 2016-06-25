/* jshint node: true, sloppy: true, white: true */

var testAcct = function ( test ) {
	test.expect(1);
	test.ok( true, 'this passes' );
	test.done();
};

module.exports = {
	testAcct: testAcct
};