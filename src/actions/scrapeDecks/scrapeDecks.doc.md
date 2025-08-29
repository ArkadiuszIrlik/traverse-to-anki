There's a problem related to the main deck "buttons". They are <button>s and
not <a> elements. This means you can't just open them in new tab. This requires
navigating back and forth in the same window, re-querying the DOM for those
elements. The risk here is that the deck list changes at some point in between
navigation.
