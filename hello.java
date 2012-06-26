public class MethodInvocation extends Applet {
        public void noArgMethod() { ... }
        public void someMethod(String arg) { ... }
        public void someMethod(int arg) { ... }
        public int  methodReturningInt() { return 5; }
        public String methodReturningString() { return "Hello"; }
        public OtherClass methodReturningObject() { return new OtherClass(); }
    }

    public class OtherClass {
        public void anotherMethod();
    }

