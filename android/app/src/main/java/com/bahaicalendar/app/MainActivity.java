package com.bahaicalendar.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(BahaiCalendarNativePlugin.class);
        super.onCreate(savedInstanceState);
    }
}
