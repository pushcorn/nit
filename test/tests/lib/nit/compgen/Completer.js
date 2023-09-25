test ("nit.compgen.Completer", () =>
{
    const Completer = nit.defineClass ("TestCompleter", "nit.compgen.Completer");

    expect (Completer.completeForRedirect ()).toBeUndefined ();
    expect (Completer.completeForType ()).toBeUndefined ();
    expect (Completer.completeForConstraint ()).toBeUndefined ();
});
