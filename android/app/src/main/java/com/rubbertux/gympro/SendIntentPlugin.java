package com.rubbertux.gympro;

import android.content.Intent;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "SendIntent")
public class SendIntentPlugin extends Plugin {

    @PluginMethod
    public void checkSendIntentReceived(PluginCall call) {
        Intent intent = getActivity().getIntent();
        String action = intent.getAction();
        String type = intent.getType();

        if (Intent.ACTION_SEND.equals(action) && type != null) {
            String sharedText = intent.getStringExtra(Intent.EXTRA_TEXT);
            // Handle cases where EXTRA_TEXT might be present even if generic
            if (sharedText != null) {
                JSObject ret = new JSObject();
                ret.put("url", sharedText);
                String title = intent.getStringExtra(Intent.EXTRA_SUBJECT); // Usually Subject in emails, sometimes
                                                                            // Title
                if (title == null)
                    title = intent.getStringExtra(Intent.EXTRA_TITLE);
                ret.put("title", title);
                call.resolve(ret);
                return;
            }
        }
        call.resolve();
    }
}
