
package apps.sling.servlet.errorhandler;

import com.adobe.cq.sightly.WCMUsePojo;

public class ResponseStatus extends WCMUsePojo {

    @Override
    public void activate() throws Exception {
        getResponse().setStatus(404);
        getResponse().setContentType("text/html");
    }
}
