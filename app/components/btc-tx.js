import Ember from 'ember';

export default Ember.Component.extend({
  changeOutputs: function() {
    var inputs = this.get('tx.incoming.inputs') || [];
    var outputs = this.get('txOutputs');
    return outputs.filter(function(output) {
      return !!inputs.findProperty('address', output.address);
    });
  }.property('tx.outgoing.outputs.@each', 'tx.incoming.inputs.@each'),
  txOutputs: function() {
    return this.get('tx.outputs') || this.get('tx.outgoing.outputs') || [];
  }.property('tx.outputs', 'tx.outgoing.outputs'),
  _txInputs: function() {
    console.log('tx', this.get('tx'));
    return this.get('tx.inputs') || this.get('tx.incoming.inputs') || [];
  }.property('tx.inputs', 'tx.incoming.inputs'),
  txInputs: Ember.computed.map('_txInputs', function(input) {
    console.log('input', input);
    var recvFrom = Ember.get(input, 'received_from');
    if (recvFrom) {Ember.set(input, 'from_output', recvFrom)};
    return input;
  }),
  outputs: Ember.computed.setDiff('txOutputs', 'changeOutputs')
});
