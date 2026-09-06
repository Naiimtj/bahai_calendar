package com.bahaicalendar.app;

import android.content.res.Configuration;
import android.view.View;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "AndroidNavigationInsets")
public class AndroidNavigationInsetsPlugin extends Plugin {

    private View observedView;
    private View.OnLayoutChangeListener layoutChangeListener;
    private int lastBottomInset = -1;

    @Override
    public void load() {
        observedView = getBridge().getWebView();
        layoutChangeListener = (
            view,
            left,
            top,
            right,
            bottom,
            oldLeft,
            oldTop,
            oldRight,
            oldBottom
        ) -> publishCurrentInset();
        observedView.addOnLayoutChangeListener(layoutChangeListener);
        observedView.post(this::publishCurrentInset);
    }

    @Override
    protected void handleOnStart() {
        super.handleOnStart();
        if (observedView != null) observedView.post(this::publishCurrentInset);
    }

    @Override
    protected void handleOnConfigurationChanged(Configuration newConfig) {
        super.handleOnConfigurationChanged(newConfig);
        if (observedView != null) observedView.post(this::publishCurrentInset);
    }

    @Override
    protected void handleOnDestroy() {
        if (observedView != null && layoutChangeListener != null) {
            observedView.removeOnLayoutChangeListener(layoutChangeListener);
        }
        super.handleOnDestroy();
    }

    @PluginMethod
    public void getBottomInset(PluginCall call) {
        getBridge().executeOnMainThread(() -> {
            JSObject result = new JSObject();
            result.put("bottom", currentBottomInset());
            call.resolve(result);
        });
    }

    static int calculateBottomObstruction(
        int navigationBottom,
        int tappableBottom,
        boolean navigationVisible,
        boolean keyboardVisible
    ) {
        if (!navigationVisible || keyboardVisible) return 0;
        return Math.max(0, Math.min(navigationBottom, tappableBottom));
    }

    private int currentBottomInset() {
        WindowInsetsCompat windowInsets = ViewCompat.getRootWindowInsets(observedView);
        if (windowInsets == null) return 0;

        Insets navigationInsets = windowInsets.getInsets(WindowInsetsCompat.Type.navigationBars());
        Insets tappableInsets = windowInsets.getInsets(WindowInsetsCompat.Type.tappableElement());
        int bottomPixels = calculateBottomObstruction(
            navigationInsets.bottom,
            tappableInsets.bottom,
            windowInsets.isVisible(WindowInsetsCompat.Type.navigationBars()),
            windowInsets.isVisible(WindowInsetsCompat.Type.ime())
        );

        float density = getActivity().getResources().getDisplayMetrics().density;
        return Math.round(bottomPixels / density);
    }

    private void publishCurrentInset() {
        int bottomInset = currentBottomInset();
        if (bottomInset == lastBottomInset) return;
        lastBottomInset = bottomInset;

        JSObject result = new JSObject();
        result.put("bottom", bottomInset);
        notifyListeners("insetsChanged", result);
    }
}
