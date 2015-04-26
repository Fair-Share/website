import Ember from 'ember';

export default Ember.Component.extend({
  changeOutputs: function() {
    var inputs = this.get('tx.incoming.inputs') || [];
    var outputs = this.get('tx.outgoing.outputs') || [];
    return outputs.filter(function(output) {
      return !!inputs.findProperty('address', output.address);
    });
  }.property('tx.outgoing.outputs.@each', 'tx.incoming.inputs.@each'),
  outputs: Ember.computed.setDiff('tx.outgoing.outputs', 'changeOutputs')
});
